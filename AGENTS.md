# Agent Guidelines for @epdoc/logger

This document provides project-specific instructions for AI agents working in
this repository.

## Package Status

### Published and Active

| Package | JSR Name | Notes |
|---------|----------|-------|
| `packages/loglevels` | `@epdoc/loglevels` | Stable |
| `packages/msgbuilder` | `@epdoc/msgbuilder` | Stable |
| `packages/logger` | `@epdoc/logger` | Stable |
| `packages/cliapp` | `@epdoc/cliapp` | Stable |

### Examples and Demos (not published)

| Package | Notes |
|---------|-------|
| `packages/demo` | Complete CLI app demo using cliapp |
| `packages/demo-cliapp` | Additional cliapp demo |
| `packages/examples` | Focused example scripts |

### Not Active — Do Not Work On Without Explicit Instruction

| Package | Reason |
|---------|--------|
| `packages/cliffapp` | Cliffy library has bugs that prevent some operations from working properly |
| `packages/demo-cliffy` | Depends on cliffapp; not supported due to the same cliffy bugs |
| `packages/logdy` | Experimental transport; not supported |
| `packages/logjava` | Not published; under development |

## Skills Reference

For general guidelines, load the following skills as needed:

- `/deno-guidelines` - Deno project structure, imports, TypeScript code style, testing
- `/jsdoc` - JSDoc commenting standards
- `/git` - Git commit messages and version bumping
- `/deno-library-docs` - Managing library-docs.json and library-metadata.json

## Development Commands

We don't generally run commands from the repo root.

Within a workspace directory (`packages/<name>/`):

| Command | Purpose |
|---------|---------|
| `deno task check` | Type-check this workspace |
| `deno task test` | Run this workspace's tests |
| `deno task lint` | Lint this workspace |
| `deno task prepublish` | Pre-publish validation (fmt + lint + check + test) |
| `deno task publish` | Publish to JSR |

Always use `-A` for development/testing permissions.

## Project Architecture

### Monorepo Layout

```
@epdoc/logger/
├── deno.json                  # Workspace root (defines all packages)
├── packages/
│   ├── loglevels/             # @epdoc/loglevels — log level definitions
│   ├── msgbuilder/            # @epdoc/msgbuilder — chainable message formatting
│   ├── logger/                # @epdoc/logger — core logging + transports
│   ├── cliapp/                # @epdoc/cliapp — CLI framework (commander.js)
│   ├── demo/                  # @epdoc/demo — complete CLI app showcase
│   ├── demo-cliapp/           # demo for cliapp package
│   └── examples/              # focused example scripts
│   (cliffapp, demo-cliffy, logdy, logjava — inactive; see Package Status above)
└── GETTING_STARTED.md
```

Each package's public entry point is `src/mod.ts` (or `main.ts` for apps).

### Package Dependency Graph

```
@epdoc/loglevels
    └── @epdoc/msgbuilder
            └── @epdoc/logger
                    └── @epdoc/cliapp
                            └── demo / demo-cliapp / examples
```

### Core Logging Flow

When `logger.info.text('hello').emit()` is called:

1. `logger.info` — the logger property getter calls `LogMgr.getMsgBuilder('INFO', this)`
2. `LogMgr.getMsgBuilder` — creates a lightweight `Emitter` capturing the logger's context (sid, reqId, pkgs) and a direct reference to `TransportMgr`, then passes it to the `MsgBuilder` factory
3. `MsgBuilder` — the returned builder (e.g. `Console.Builder`) is used for chainable formatting (`.h1()`, `.text()`, `.value()`, etc.)
4. `.emit()` on the MsgBuilder — calls `Emitter.emit(entry)` directly on the `TransportMgr`, bypassing the Logger entirely
5. `TransportMgr` — routes the `Entry` object to each registered transport

`LogMgr.emit(entry)` can also be called directly to bypass the logger and MsgBuilder and push a raw `Entry` to the transports.

### Key Classes

| Class | Package | Purpose |
|-------|---------|---------|
| `LogMgr` (exported as `Mgr`) | `@epdoc/logger` | Central manager: creates loggers, owns TransportMgr, and routes Entry objects to transports |
| `Emitter` | `@epdoc/logger` | Lightweight per-call object created by LogMgr; captures logger context and emits Entry directly to TransportMgr |
| `AbstractLogger` (base for all loggers) | `@epdoc/logger` | Base class providing `getChild()`, threshold, `mark()`/`demark()`, sid/reqId/pkg context |
| `Console.Builder` | `@epdoc/msgbuilder` | Concrete chainable MsgBuilder (colors, h1/h2, value, etc.) |
| `AbstractMsgBuilder` (exported as `Abstract`) | `@epdoc/msgbuilder` | Base for custom MsgBuilder implementations |
| `LogLevels` | `@epdoc/loglevels` | Defines and manages a named set of log levels |
| `Cmd.AbstractBase` | `@epdoc/cliapp` | Base class for all CLI commands (commander.js-based) |
| `Ctx.AbstractBase` | `@epdoc/cliapp` | Base context class holding `log`, `logMgr`, `dryRun`, `pkg` |

### Logger Variants (in `packages/logger/src/loggers/`)

The logger classes form an inheritance hierarchy. Each adds level-specific getter methods on top of its parent.

```
AbstractLogger  (base: threshold, getChild, mark/demark, emit)
    └── IndentLogger  (adds: indent/outdent/nodent, getIndentedMsgBuilder)
            └── BareLogger   (adds: warn, info)
                    └── MinLogger    (adds: error, debug)
                            ├── CliLogger    (adds: help, data, prompt, verbose, input, silly)
                            └── OtlpLogger   (adds: fatal, trace)
                                    └── StdLogger    (adds: critical, verbose, spam, silly)
```

| Namespace | Exported as | Log Levels |
|-----------|-------------|------------|
| `Base` | `AbstractLogger` | _(base class, no level getters)_ |
| `Indent` | `IndentLogger` | _(adds indentation, no level getters)_ |
| `Bare` | `BareLogger` | `warn`, `info` |
| `Min` | `MinLogger` | `warn`, `info`, `error`, `debug` |
| `Cli` | `CliLogger` | `warn`, `info`, `error`, `debug`, `help`, `data`, `prompt`, `verbose`, `input`, `silly` |
| `Std` | `StdLogger` | `warn`, `info`, `error`, `debug`, `critical`, `verbose`, `spam`, `silly`, `fatal`, `trace` |

`Std.Logger` is the default when calling `logMgr.getLogger()` without specifying a factory.

Each log level has a corresponding numeric value that is based on [OTLP](https://opentelemetry.io/docs/specs/otel/logs/data-model/#displaying-severity).

### Transport Types (in `packages/logger/src/transports/`)

| Transport | Purpose |
|-----------|---------|
| `Transport.Console.Transport` | Writes to stdout/stderr |
| `Transport.File.Transport` | Writes to a file |
| `Transport.Buffer.Transport` | Stores entries in memory (useful for testing) |
| `Transport.Influx.Transport` | Writes to InfluxDB |

## Log Entry Structure

`Entry` is the core data structure passed from the `Emitter` through `LogMgr` to each transport.

```typescript
type Entry = {
  level: Level.Name;       // e.g. 'INFO', 'ERROR'
  timestamp?: Date;        // added by LogMgr.emit() if absent
  time?: HrMilliseconds;   // optional response/elapsed time
  sid?: string;            // session ID
  reqId?: string;          // request ID
  pkg?: string;            // source namespace (e.g. 'MyClass.method')
  msg: string | IFormatter | undefined;  // the formatted message
  data?: unknown;          // optional structured data
};
```

`LogMgr.emit(entry)` can be called directly to push a raw `Entry` to all transports, bypassing logger threshold checks. Use `LogMgr.forceEmit(entry)` to also bypass transport threshold checks.

## Recommended Setup Patterns

### Basic Logging

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

const logMgr = new Log.Mgr<MsgBuilder>();
const logger = await logMgr.getLogger<Logger>();

logger.info.h1('Hello World').emit();
logger.info.value('key', someValue).emit();
```

### Custom MsgBuilder Extension

```typescript
class AppBuilder extends Console.Builder {
  apiCall(method: string, endpoint: string) {
    return this.text(`[API] ${method} ${endpoint}`);
  }
}
type Logger = Log.Std.Logger<AppBuilder>;

const logMgr = new Log.Mgr<AppBuilder>();
logMgr.msgBuilderFactory = (emitter) => new AppBuilder(emitter);
const logger = await logMgr.getLogger<Logger>();
logger.info.apiCall('GET', '/users').emit();
```

### Child Logger (per-request context)

```typescript
const childLogger = logger.getChild({ reqId: 'req-123', sid: 'sess-456', pkg: 'auth' });
```

### CLI App with cliapp (commander.js)

Extend `Ctx.AbstractBase` for your application context, then use `Cmd.AbstractBase` for commands. See `packages/demo` for a complete working example.

```typescript
import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';

// 1. Define a context (extend AbstractBase)
class AppContext extends CliApp.Ctx.AbstractBase<AppBuilder, AppLogger> {
  protected override builderClass = AppBuilder;
}

// 2. Define a root command (extend Cmd.AbstractBase)
class RootCmd extends CliApp.Cmd.AbstractBase<AppContext, AppContext, AppOptions> {
  // implement setupOptions(), execute(), etc.
}

// 3. Run
const ctx = new AppContext(pkg);
await ctx.setupLogging({ pkg: 'app' });
const rootCmd = new RootCmd(ctx);
await CliApp.run(ctx, rootCmd);
```

## Internal Import Aliases (logger package)

The `logger` package uses these internal aliases defined in its `deno.json`:

| Alias | Resolves to |
|-------|------------|
| `$log` | `./src/types.ts` |
| `$logger` | `./src/loggers/mod.ts` |
| `$transport` | `./src/transports/mod.ts` |

## Workspace-Specific Notes

### `packages/demo`
- Uses `file:` imports to reference sibling packages (not JSR versions).
- Entry point is `main.ts` (not `src/mod.ts`).
- Install as a CLI tool: `deno task install`.

### `packages/demo-cliapp` and `packages/examples`
- Reference-only demo/example packages. Not published to JSR.

## Library Documentation

Each published workspace should contain:
- `library-docs.json` — Auto-generated API docs. Regenerate with:
  ```bash
  deno doc --json src/mod.ts > library-docs.json
  ```
- `library-metadata.json` — Curated package summary. Generate if missing; never overwrite without permission.

`library-docs.json` is listed in `.gitignore` and must not be committed.

Consult `AI.md`, `ARCHITECTURE.md`, `CONFIGURATION.md`, and `GETTING_STARTED.md` for additional architecture details.
