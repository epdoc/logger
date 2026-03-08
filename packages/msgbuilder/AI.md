# @epdoc/msgbuilder -- AI Reference

A chainable message builder that styles console text. It accumulates message parts, then on `emit()` packages itself (as `IFormatter`) into `EmitterData` and calls a callback on its `IEmitter`.

**Purpose**: Build formatted strings. Works standalone or integrates with `@epdoc/logger` via the `IEmitter` interface.

**What it does NOT do**: Write output directly (it delegates to emitter), manage log levels (emitter decides), route to transports (logger package does that).

---

## External Dependencies

| Import | Used For |
|--------|----------|
| `@std/fmt/colors` | ANSI color functions (bold, dim, rgb24, etc.) |
| `@epdoc/type` | Type guards (`_.isDict`, `_.isInteger`, etc.), `Dict` type |
| `@epdoc/duration` | `HrMilliseconds` type for elapsed time |
| `@epdoc/string` | `StringUtil` base class |
| `node:os`, `node:path` | `relative()` path formatting |
| `Deno.noColor`, `Deno.cwd()` | Runtime globals |

---

## Cross-Boundary Contracts

These interfaces are the contract with `@epdoc/logger`. The `Emitter` class in logger implements `IEmitter`.

```typescript
// The emitter callback interface
interface IEmitter {
  dataEnabled: boolean;      // Include data payloads in message
  emitEnabled: boolean;      // Check before calling emit()
  stackEnabled: boolean;     // Include stack traces on errors
  emit: (msg: EmitterData) => EmitterData;  // THE CALLBACK
  demark?: (name: string, keep?: boolean) => number;  // EWT support
}

// What gets passed to IEmitter.emit()
type EmitterData = {
  timestamp: Date;
  formatter: IFormatter;     // The builder itself (implements this)
  data: Dict | undefined;
  elapsed: HrMilliseconds;   // For EWT display
};

// Implemented by AbstractMsgBuilder - transports call this
interface IFormatter {
  format(opts?: FormatOpts): string;
  appendMsgPart(str: string, style?: StyleFormatterFn | null): IFormatter;
  prependMsgPart(str: string, style?: StyleFormatterFn | null): IFormatter;
}

// Factory type used by LogMgr.msgBuilderFactory
type FactoryMethod = (emitter: IEmitter) => AbstractMsgBuilder;

// Supporting types
type FormatOpts = { color?: boolean; target?: 'console' | 'json' | 'jsonArray'; msgSep?: number };
type StyleFormatterFn = (str: string) => string;
type StyleArg = string | number | Record<string, unknown> | unknown[] | unknown;
type MsgPart = { str: string; style?: StyleFormatterFn };
```

---

## AbstractMsgBuilder (Simplified)

Base class that accumulates message parts and implements `IFormatter`.

```typescript
abstract class AbstractMsgBuilder implements IFormatter {
  // Construction
  constructor(emitter?: IEmitter);  // Defaults to ConsoleEmitter

  // State
  protected _emitter: IEmitter;
  protected _msgParts: MsgPart[] = [];
  protected _data: Dict | undefined;
  protected _dimMode: boolean = false;
  protected _boldMode: boolean = false;
  protected _allow: boolean = true;        // Conditional logic

  // Core accumulation - ALL styling methods delegate here
  public stylize(style: StyleFormatterFn | null, ...args: StyleArg[]): this;
  public plain(...args: unknown[]): this;   // Unstyled text
  public comment(...args: string[]): this;  // Suffix comment

  // Conditional logic
  public if(val: boolean): this;
  public elif(val: boolean): this;
  public else(): this;
  public endif(): this;

  // Indentation
  public indent(n: number | string): this;  // n spaces or string
  public tab(n: number): this;              // Deprecated, use indent

  // Data payload (if emitter.dataEnabled)
  public data(data: unknown): this;

  // THE EMIT: packages into EmitterData, calls _emitter.emit()
  public emit(...args: unknown[]): EmitterData | undefined;

  // Emit with elapsed wall time
  public ewt(mark: string | number, keep?: boolean): EmitterData | undefined;

  // IFormatter implementation
  public format(opts?: FormatOpts): string;  // Joins parts with styles applied
  public appendMsgPart(str: string, style?: StyleFormatterFn | null): this;
  public prependMsgPart(str: string, style?: StyleFormatterFn | null): this;

  // Standalone output
  public log(): void;  // console.log(this.format())
  public clear(): this;  // Reset for reuse
}
```

**Key insight**: `stylize()` is the funnel. Every styled method chains through it. When `emit()` is called, the builder packages `this` as the `formatter` inside `EmitterData`.

---

## Console.Builder (Simplified)

Extends `AbstractMsgBuilder`. Each method is: `return this.stylize(this.styles.X, ...args);`

```typescript
class ConsoleMsgBuilder extends AbstractMsgBuilder {
  // Static theme - subclasses can override
  static styleFormatters: ConsoleStyleMap;
  protected get styles(): ConsoleStyleMap;  // Accesses this.constructor.styleFormatters

  // ─── Text Hierarchy ────────────────────────────────────────────────────────
  text(...args): this;   // Body text
  h1(...args): this;     // Top heading
  h2(...args): this;     // Secondary heading
  h3(...args): this;     // Tertiary heading

  // ─── Semantic Styles ───────────────────────────────────────────────────────
  action(...args): this;      // Verbs/commands
  label(...args): this;       // Key names
  highlight(...args): this;   // Emphasis
  value(...args): this;       // Values
  code(...args): this;        // Inline code

  // ─── Navigation/References ─────────────────────────────────────────────────
  path(...args): this;        // File paths
  url(...args): this;         // URLs
  relative(path: string): this;  // Smart home/cwd-relative paths

  // ─── Status ────────────────────────────────────────────────────────────────
  warn(...args): this;
  error(...args): this;
  success(...args): this;
  strikethru(...args): this;

  // ─── Icons ─────────────────────────────────────────────────────────────────
  icheck(color?): this;   // ✓ defaults to success style
  ialert(color?): this;   // ⚠ defaults to warn style
  ierror(color?): this;   // ✗ defaults to error style
  iarrow(color?): this;   // → defaults to value style
  istar(color?): this;    // ★ defaults to highlight style

  // ─── Dim/Bold Mode ─────────────────────────────────────────────────────────
  dim(val?: boolean | StyleArg, ...rest): this;   // Toggle or one-time
  undim(): this;
  bold(val?: boolean | StyleArg, ...rest): this;  // Toggle or one-time
  unbold(): this;

  // ─── Composite Helpers ─────────────────────────────────────────────────────
  count(num: number): this;   // Sets pluralization flag for next method
  section(str?: string): this;  // Horizontal divider with optional title
  err(error: unknown, opts?: IConsoleErrOpts): this;  // Formatted error

  // ─── Date ──────────────────────────────────────────────────────────────────
  date(...args): this;

  // ─── Factory ───────────────────────────────────────────────────────────────
  static create(emitter: IEmitter): ConsoleMsgBuilder;
}

// Style map type
interface ConsoleStyleMap {
  text: StyleFormatterFn;
  h1: StyleFormatterFn; h2: StyleFormatterFn; h3: StyleFormatterFn;
  action: StyleFormatterFn; label: StyleFormatterFn; highlight: StyleFormatterFn; value: StyleFormatterFn;
  path: StyleFormatterFn; url: StyleFormatterFn;
  date: StyleFormatterFn; code: StyleFormatterFn;
  warn: StyleFormatterFn; error: StyleFormatterFn; success: StyleFormatterFn; strikethru: StyleFormatterFn;
  dim: StyleFormatterFn; bold: StyleFormatterFn;
}

// Error formatting options
interface IConsoleErrOpts {
  code?: boolean;    // Include error.code
  cause?: boolean;   // Include error.cause (default: true)
  path?: boolean;    // Include error.path (default: true)
  stack?: boolean;   // Include stack trace (default: false)
}
```

---

## Data Flow

```
User calls:  logger.info.h1('Title').value(123).emit()

                    ↓
            ┌──────────────────┐
            │  MsgBuilder      │
            │  - Accumulates   │
            │    message parts │
            │  - Implements    │
            │    IFormatter    │
            └────────┬─────────┘
                     │
                     │ emit() called
                     │ Builds EmitterData:
                     │   { timestamp,
                     │     formatter: this,
                     │     data, elapsed }
                     ↓
            ┌──────────────────┐
            │  IEmitter.emit() │  ← Callback to @epdoc/logger
            │  (provided by    │     Emitter class
            │   logger)        │
            └────────┬─────────┘
                     │
                     │ Converts EmitterData
                     │ to Entry, routes to
                     │ TransportMgr
                     ↓
            ┌──────────────────┐
            │  Transport       │
            │  (Console, File, │
            │   Buffer, etc.)  │
            └────────┬─────────┘
                     │
                     │ Calls entry.formatter.format()
                     │ to get final string
                     ↓
            ┌──────────────────┐
            │  Final Output    │
            └──────────────────┘
```

**Critical for Emitter work**: The `emit()` method checks `this._emitter.emitEnabled` before calling `this._emitter.emit()`. The logger's `Emitter` class must implement `IEmitter` and handle the `EmitterData → Entry` conversion.

---

## Standalone Usage

When used without a logger (testing, formatting only):

```typescript
import { Console } from '@epdoc/msgbuilder';

const builder = new Console.Builder();  // Uses ConsoleEmitter
const str = builder.h1('Hello').value(123).format({ color: false });
// Or: builder.h1('Hello').value(123).log();
// Or: builder.h1('Hello').value(123).emit(); → calls console.log
```

`ConsoleEmitter` (simple) and `TestEmitter` (captures output) are provided for standalone use. The real `Emitter` in `@epdoc/logger` is the production implementation.

---

## Extension Pattern

```typescript
class MyBuilder extends Console.Builder {
  static override styleFormatters = myCustomTheme;

  apiCall(method: string, endpoint: string) {
    return this.text(`[API] ${method} ${endpoint}`);
  }
}

// Use with logger:
logMgr.msgBuilderFactory = (emitter) => new MyBuilder(emitter);
```

---

## Key File References

| File | Purpose |
|------|---------|
| `src/types.ts` | `IEmitter`, `IFormatter`, `EmitterData`, `FactoryMethod` |
| `src/abstract.ts` | `AbstractMsgBuilder` base class |
| `src/console/builder.ts` | `ConsoleMsgBuilder` (`Console.Builder`) |
| `src/console/types.ts` | `ConsoleStyleMap`, `IConsoleMsgBuilder`, `IConsoleErrOpts` |
| `src/emitter.ts` | `ConsoleEmitter`, `TestEmitter` (simple IEmitter implementations) |
| `src/mod.ts` | Package exports: `Abstract`, `Console`, `IEmitter`, etc. |

---

**Current version**: 0.1.7 | **Entry**: `src/mod.ts` | **JSR**: `@epdoc/msgbuilder`
