# Plan: Progress Line Feature for packages/template

## Goal

Add progress-aware logging so that `ctx.log.info.text('Downloading').start()`
shows a terminal spinner when the log threshold is exactly `info`, emits
normally when the threshold is below `info` (e.g., `debug`), and is silent when
the threshold is above `info` (e.g., `warn`).

## API

```ts
const chunks = 10;

// Start a progress operation
ctx.log.info.text('Downloading').label('fakefile.rsc').start(chunks);

// Optionally update the displayed text mid-operation
ctx.log.info.text('Downloading chunk').value(3).text('of').value(chunk).update(3);

// Stop and show final message with elapsed time
ctx.log.info.text('Downloaded').label('fakefile.rsc').stop();
```

Also works with `ctx.log.verbose`, `ctx.log.debug`, etc. — the 3-mode logic
applies to whichever level is used.

No `ctx.progress` accessor is needed. The `start()` call is the signal that
this is a progress operation.

## Three Modes

For a given level (e.g., `info`):

| Condition | Mode | `start()` | `update()` | `stop()` |
|---|---|---|---|---|
| Threshold > level | **SUPPRESSED** | No-op | No-op | No-op |
| Threshold == level | **PROGRESS** | Create ProgressLine, show spinner | Update ProgressLine text (or percentage for future bar) | Stop ProgressLine, show final text + elapsed time |
| Threshold < level | **EMIT** | Emit log message | Emit log message | Emit log message + elapsed time via `ewt()` |

The mode name is **PROGRESS** (not "SPINNER") because ProgressLine will support
both a spinner and a progress bar in the future.

## Architecture Overview

### How the mode is determined

When `ctx.log.info` is called, `LogMgr.getMsgBuilder('INFO', logger)` computes
`meetsThreshold(level)`. We also compare the level value to the raw threshold:

- `!meetsThreshold` → SUPPRESSED (threshold is above this level)
- `meetsThreshold && levelValue === threshold` → PROGRESS (exact match)
- `meetsThreshold && levelValue !== threshold` → EMIT (threshold is below)

The `progressEnabled` flag is true when in PROGRESS mode. The ProgressMsgBuilder
reads it via `this._emitter.progressEnabled`.

### How state is shared between start() and stop()

Each `ctx.log.info` call creates a **new** MsgBuilder + Emitter pair. The
MsgBuilder from the `start()` call is a different object than the MsgBuilder
from the `stop()` call. The ProgressLine created in `start()` must be
retrievable by `stop()`.

**Solution: a simple `ProgressState` object captured by the factory closure.**

```ts
class ProgressState {
  line?: ProgressLine;   // The active ProgressLine (spinner/bar)
  t0?: number;           // performance.now() timestamp from start()
}
```

Since only one progress line displays at a time on console, a single shared
object suffices.

In the template's Context:

```ts
const state = new ProgressState();

this.logMgr.msgBuilderFactory = (emitter) => {
  return new ProgressMsgBuilder(emitter, state);
};
```

Every ProgressMsgBuilder receives a reference to the same object:
- `start()` creates a ProgressLine, stores it in `state.line`, and records
  `state.t0 = performance.now()`.
- `stop()` reads `state.line`, calls `line.stop(finalMessage)`, and clears both
  fields.
- `update()` reads `state.line` and calls `line.update(message)`.

### Elapsed time handling

- In PROGRESS mode: `stop()` computes `performance.now() - progressState.t0`
  and formats it into the final message string manually (since the message goes
  to ProgressLine, not through the transport system).
- In EMIT mode: `stop()` calls `this.ewt(progressState.t0)` which is an
  existing MsgBuilder method that accepts a raw timestamp number, computes
  elapsed, and emits through the transport system (which formats the elapsed
  time in its own column).
- The `formatElapsed()` helper for PROGRESS mode should match the console
  transport's precision logic (3 decimal places for <1ms, 2 for <10ms, etc.).

## Changes Required

### Package: `@epdoc/msgbuilder`

**File: `src/types.ts`** — Add one optional property to `IEmitter`:

```ts
export interface IEmitter {
  // ... existing members unchanged ...

  /**
   * Indicates that this log level is exactly at the threshold — not below it.
   * Used by progress-aware MsgBuilder subclasses to determine whether to show
   * an interactive progress indicator (true) or emit normally (false).
   * Optional; defaults to false if not implemented.
   */
  progressEnabled?: boolean;
}
```

No other changes to this package.

### Package: `@epdoc/logger`

**File: `src/emitter.ts`** — Add `#progressEnabled` field and getter:

```ts
// New constructor parameter (add to thresholds object):
readonly #progressEnabled: boolean;

// New getter:
get progressEnabled(): boolean {
  return this.#progressEnabled;
}
```

The constructor signature gains one more boolean:

```ts
thresholds: {
  meetsThreshold: boolean;
  meetsFlushThreshold: boolean;
  progressEnabled: boolean;   // NEW
},
```

**File: `src/logmgr.ts`** — In `getMsgBuilder()`, compute `progressEnabled`:

```ts
public getMsgBuilder(level: string, emitter: Logger.IEmitter): M {
  const meetsThreshold = this.meetsThreshold(level);
  const meetsFlushThreshold = this.meetsFlushThreshold(level);
  // NEW: is this level exactly at the threshold?
  const levelValue = this._logLevels!.asValue(level);
  const progressEnabled = meetsThreshold && (levelValue === this._threshold);

  const directEmitter = new Emitter(
    this,
    level as Level.Name,
    { ... },                    // context — unchanged
    {
      meetsThreshold,
      meetsFlushThreshold,
      progressEnabled,          // NEW
    },
    ...                         // remaining params — unchanged
  );

  return this._msgBuilderFactory(directEmitter) as unknown as M;
}
```

This uses direct threshold comparison (`levelValue === this._threshold`)
instead of `meetsThreshold(levelValue - 1)`, avoiding issues with non-standard
level values in `asValue()`.

### Package: `packages/template`

**File: `src/progress/monitor.ts`** — Complete rewrite. Two exports:

1. `ProgressState` — typed container for shared state:

```ts
export class ProgressState {
  line?: ProgressLine;
  t0?: number;
}
```

2. `ProgressMsgBuilder` — extends `Console.Builder`:

```ts
export class ProgressMsgBuilder extends Console.Builder {
  #state: ProgressState;

  constructor(emitter: MsgBuilder.IEmitter, state: ProgressState) {
    super(emitter);
    this.#state = state;
  }

  get #isSuppressed(): boolean {
    return !this._emitter.emitEnabled;
  }

  get #isProgress(): boolean {
    return this._emitter.emitEnabled &&
      (this._emitter.progressEnabled ?? false);
  }

  start(): void { ... }
  stop(): void { ... }
  update(message?: string, _pct?: number): void { ... }
}
```

See the "ProgressMsgBuilder Implementation" section below for full method
bodies.

Remove `ProgressMonitor` — it is no longer needed.

**File: `src/progress/mod.ts`** — Update exports:

```ts
export { ProgressLine as Line } from './line.ts';
export { ProgressMsgBuilder as MsgBuilder, ProgressState as State } from './monitor.ts';
```

**File: `src/progress/line.ts`** — The
existing `start(message)`, `update(message)`, `stop(finalMessage)` API is
sufficient. However we now track progress and need to initialize the
chunk total (default 1) and use update to update the progress bar percentage.
We will then add a variable for the number of characters wide the progress bar
should be (default 10) and then use available characters to represent progress.

**File: `src/context.ts`** — Key changes:

1. Remove the `CustomMsgBuilder` start/stop stubs (revert to plain class).
2. Remove the `#progress` field and `get progress()` getter.
3. Override `setupLogging` (or adjust `builderClass` usage) to set up the
   factory closure with shared state:

```ts
export class Context extends CliApp.Ctx.AbstractBase {
  declare app: unknown;
  format: string = 'text';

  constructor(pkg: CliApp.DenoPkg | Context, params: Log.IGetChildParams = {}) {
    super(pkg, params);
    if (pkg instanceof Context) {
      this.copyProperties(pkg);
    }
  }

  override async setupLogging(
    levelOrParams: string | Log.IGetChildParams = 'info',
    params?: Log.IGetChildParams,
  ): Promise<void> {
    const state = new Progress.State();
    this.logMgr.msgBuilderFactory = (emitter) =>
      new Progress.MsgBuilder(emitter, state);
    // Delegate to parent for the rest (initLevels, threshold, getLogger)
    await super.setupLogging(levelOrParams, params);
  }
}
```

**Concern — overriding setupLogging:** The parent `setupLogging` sets the
factory from `this.builderClass` (line 225-227 of cliapp context.ts):

Review: Is it not possible to set the class in the Context?

```ts
  protected override builderClass = Progress.MsgBuilder;
```

```ts
if (this.builderClass) {
  this.logMgr.msgBuilderFactory = (emitter) => new this.builderClass!(emitter);
}
```
If we override `setupLogging` and set the factory BEFORE calling `super`, the
parent will overwrite it if `builderClass` is still set. Two solutions:
- Set `this.builderClass` to `undefined` before calling `super.setupLogging()`.
- Or set the factory AFTER calling `super.setupLogging()` — but then the logger
  is already created. Check if that matters (the factory is used on each
  `log.info` call, not at logger creation time, so setting it after should be
  fine).

**Recommendation:** Set factory after super call:
```ts
override async setupLogging(...) {
  await super.setupLogging(levelOrParams, params);
  const state = new Progress.State();
  this.logMgr.msgBuilderFactory = (emitter) =>
    new Progress.MsgBuilder(emitter, state);
}
```

Or remove the `builderClass` override entirely and always set the factory
manually.

**File: `src/mod.ts`** — Ensure Ctx is exported:

```ts
export * as Cmd from './cmd/mod.ts';
export * as Ctx from './context.ts';
export * as Domain from './domain/mod.ts';
```

**File: `src/deps.ts`** — No changes needed.

## ProgressMsgBuilder Implementation Detail

```ts
start(): void {
  if (this.#isSuppressed) return;

  this.#state.t0 = performance.now();

  if (this.#isProgress) {
    const line = new ProgressLine();
    this.#state.line = line;
    line.start(this.format());
  } else {
    // EMIT mode: log the message normally
    this.emit();
  }
}

stop(): void {
  if (this.#isSuppressed) return;

  if (this.#isProgress) {
    const formatted = this.format();
    const finalMsg = this.#state.t0 !== undefined
      ? `${formatted} ${formatElapsed(performance.now() - this.#state.t0)}`
      : formatted;
    this.#state.line?.stop(finalMsg);
    this.#state.line = undefined;
    this.#state.t0 = undefined;
  } else {
    // EMIT mode: log with elapsed time
    if (this.#state.t0 !== undefined) {
      this.ewt(this.#state.t0);
    } else {
      this.emit();
    }
    this.#state.t0 = undefined;
  }
}

update(message?: string, _pct?: number): void {
  if (this.#isSuppressed) return;

  if (this.#isProgress) {
    // Update the progress line with new text (or formatted builder text)
    const text = message ?? this.format();
    this.#state.line?.update(text);
  } else {
    // EMIT mode: just emit as a normal log message
    if (message) this.text(message);
    this.emit();
  }
}
```

### update() design notes

- `update()` with no args uses `this.format()` — the text built with the
  chainable API.
- `update(message)` with a string uses that directly.
- The `_pct` parameter is reserved for future progress bar support. When
  ProgressLine gains bar support, `update(undefined, 0.5)` would update the bar
  to 50%.
- In EMIT mode, update() emits a regular log message. This makes sense: if
  you're in verbose/debug mode, you see every update as a separate log line.

## Test Strategy

**File: `test/progress.test.ts`** — Complete rewrite.

Tests should cover:

1. **SUPPRESSED mode** (threshold = 'warn', call info.start/stop):
   - Verify no output is produced (use Buffer transport).
   - Verify ProgressLine is NOT created (state.line remains undefined).

2. **PROGRESS mode** (threshold = 'info', call info.start/stop):
   - Hard to test the actual terminal spinner in a unit test.
   - Verify `state.line` is set after `start()` and cleared after `stop()`.
   - Could mock/spy ProgressLine or test with a subclass.
   - Verify `stop()` clears the state.

3. **EMIT mode** (threshold = 'debug', call info.start/stop):
   - Use Buffer transport to capture emitted messages.
   - Verify `start()` emits a message.
   - Verify `stop()` emits a message with elapsed time.

4. **update() in each mode**: Similar verification.

5. **Elapsed time**: Verify stop message includes timing info (may need to use
   a small delay or mock `performance.now()`).

**Concern:** The test needs `setupLogging()` to be awaited before using the
logger. The existing test file had `await` inside a non-async function — fix
this.

## Concerns and Pitfalls

### 1. Single active progress at a time

The ProgressState holds one `line` and one `t0`. You cannot have two concurrent
progress operations. If `start()` is called twice without an intervening
`stop()`, the second `start()` will overwrite the first. The implementer should
decide whether to:
- Silently stop the previous ProgressLine before starting a new one.
- Warn/throw.
- Document the limitation.

**Recommendation:** Silently stop the previous line (defensive). Add a check in
`start()`:
```ts
if (this.#state.line) {
  this.#state.line.stop();  // stop previous without a final message
}
```

### 2. Direct threshold comparison

The implementation uses `levelValue === this._threshold` to detect PROGRESS
mode. This is cleaner than `meetsThreshold(levelValue - 1)` which could fail
if `asValue()` rejects non-standard level values.

### 3. Factory constructor signature mismatch

The `FactoryMethod` type in msgbuilder is:
```ts
type FactoryMethod = (emitter: IEmitter) => AbstractMsgBuilder;
```

But ProgressMsgBuilder takes two args: `(emitter, state)`. The factory closure
handles this by capturing `state`:
```ts
(emitter) => new ProgressMsgBuilder(emitter, state)
```

This is fine — the closure matches the `FactoryMethod` signature.

### 4. _emitter is protected, not public

ProgressMsgBuilder accesses `this._emitter.emitEnabled` and
`this._emitter.progressEnabled`. Since `_emitter` is `protected` on
`AbstractMsgBuilder`, and ProgressMsgBuilder extends Console.Builder (which
extends AbstractMsgBuilder), this access is valid.

### 5. ProgressLine writes to stderr

ProgressLine uses `Deno.stderr.writeSync`. This means:
- In PROGRESS mode, the spinner goes to stderr.
- In EMIT mode, the message goes through the logger transport (usually stdout
  for console transport, configurable).
- This is intentional — progress indicators shouldn't mix with stdout output.
  But verify that the console transport's output target doesn't conflict.

### 6. The builderClass override in Context

Currently `context.ts` has `protected override builderClass = Progress.MsgBuilder`.
If we switch to setting the factory manually in `setupLogging`, we should remove
this line to prevent the parent's `setupLogging` from overwriting our factory.

### 7. Child contexts

When `new Context(parentContext)` is called, the child gets the parent's logger
via `getChild()` and the parent's `logMgr`. The factory on `logMgr` is already
set (it's on the shared logMgr instance). So child contexts automatically get
ProgressMsgBuilder support. However, the ProgressState is also shared — meaning
a child context's progress operations share state with the parent. This is
probably fine for serial usage but worth noting.

### 8. update() creates a new MsgBuilder each time

In EMIT mode, `ctx.log.info.text('new status').update()` creates a new builder
and calls `emit()`. This means each update is a separate log line. In PROGRESS
mode, only the ProgressLine text changes (no new log line). This behavioral
difference is intentional and correct.

## File Change Summary

| Package | File | Change |
|---|---|---|
| `@epdoc/msgbuilder` | `src/types.ts` | Add `progressEnabled?: boolean` to `IEmitter` |
| `@epdoc/logger` | `src/emitter.ts` | Add `_progressEnabled` field, `progressEnabled` getter |
| `@epdoc/logger` | `src/logmgr.ts` | Compute `isProgressLevel` in `getMsgBuilder()`, pass to Emitter |
| `packages/template` | `src/progress/monitor.ts` | Rewrite: `ProgressState` + `ProgressMsgBuilder` (remove `ProgressMonitor`) |
| `packages/template` | `src/progress/mod.ts` | Update exports |
| `packages/template` | `src/context.ts` | Remove `ctx.progress`, set factory in `setupLogging` override |
| `packages/template` | `src/mod.ts` | Add `Ctx` export |
| `packages/template` | `test/progress.test.ts` | Rewrite tests |

## Implementation Order

1. `@epdoc/msgbuilder` — add `progressEnabled` to IEmitter (1 line)
2. `@epdoc/logger` — compute and expose `progressEnabled` in Emitter/LogMgr
3. Run `deno task check` and `deno task test` in both packages to verify no
   regressions
4. `packages/template` — implement ProgressState, ProgressMsgBuilder, update
   Context
5. `packages/template` — write tests
6. Run `deno task prepublish` in template to verify everything passes

## Future: Progress Bar

When ProgressLine gains progress bar support:
- `update(undefined, 0.3)` updates the bar to 30%.
- The `_pct` parameter on `update()` is already reserved for this.
- ProgressLine will need a `updateBar(pct: number)` method (or extend
  `update()` to accept a percentage).
- The `start()` method may need a way to indicate "use bar mode vs spinner
  mode" — perhaps via a `bar()` chainable method on ProgressMsgBuilder that
  sets a flag before `start()` is called.

---


