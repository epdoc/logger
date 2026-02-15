# @epdoc/cliapp

Type-safe CLI framework supporting commander.js-based command hierarchies, with integrated logging, context flow, and MCP server support.

## Features

- **Builds on Commander.js** — Supports everything that [Commander.js](https://github.com/tj/commander.js) supports
- **Built-in Logging** — Integrated [@epdoc/logger](../logger/README.md) with automatic configuration
- **Custom Message Builders** — Extend message formatting with application-specific methods
- **Automatic MCP Support** — Commands exposed via [MCP](https://modelcontextprotocol.io/docs/getting-started/intro) for use by AI, with no extra work
- **Context Flow** — Parent context flows to child commands automatically
- **Type-Safe** — Full TypeScript support with generic constraints
- **Production Ready** — Error handling, signal management, and cleanup

## Installation

```bash
deno add @epdoc/cliapp @epdoc/logger @epdoc/msgbuilder
```

## Quick Start

```typescript
import * as CliApp from '@epdoc/cliapp';
import pkg from './deno.json' with { type: 'json' };

// 1. Define context
class AppContext extends CliApp.Ctx.AbstractBase {
  protected override builderClass = CliApp.Ctx.MsgBuilder;
}

// 2. Define root command
class RootCommand extends CliApp.Cmd.AbstractBase<AppContext, AppContext> {
  constructor(ctx: AppContext) {
    super(ctx, { ...pkg, root: true });
  }

  override defineOptions() {
    this.commander.option('-f, --force', 'Force operation');
  }

  override execute() {
    this.ctx.log.info.text('Hello World').emit();
  }
}

// 3. Run
if (import.meta.main) {
  const ctx = new AppContext(pkg);
  await ctx.setupLogging({ pkg: 'app' });
  const rootCmd = new RootCommand(ctx);
  await CliApp.run(ctx, rootCmd);
}
```

## Documentation

- **[Design Decisions](./DESIGN.md)** — Technical architecture notes
- **[Test Examples](./test/)** — Verified working examples (see below)
- **[Demo App](../demo/)** — Production-grade CLI with MCP support

## Key Concepts

### Context

The context is the central state object passed through the entire command tree. It holds the logger, log manager, dry-run flag, and any application-specific state.

All contexts extend `CliApp.Ctx.AbstractBase`. You must call `setupLogging()` on the root context before calling `run()`.

```typescript
class AppContext extends CliApp.Ctx.AbstractBase {
  // Add app-specific state
  configFile?: string;
}

const ctx = new AppContext(pkg);
await ctx.setupLogging({ pkg: 'app' });
```

### Custom Message Builder

To add application-specific log formatting methods, extend `Console.Builder` (or `CliApp.Ctx.MsgBuilder`) and set `builderClass`:

```typescript
import { Console } from '@epdoc/msgbuilder';
import type * as Log from '@epdoc/logger';

class AppBuilder extends Console.Builder {
  fileOp(op: string, path: string) {
    return this.label(op).value(path);
  }
}
type AppLogger = Log.Std.Logger<AppBuilder>;

class AppContext extends CliApp.Ctx.AbstractBase<AppBuilder, AppLogger> {
  protected override builderClass = AppBuilder;
}
```

See [example.04.test.ts](./test/example.04.test.ts) for a complete working example.

### Commands with Subcommands

Override `getSubCommands()` to return subcommand instances. Subcommands do not receive a context in their constructor — they receive the parent's hydrated context via `setParentContext()` during the preAction hook.

```typescript
class RootCommand extends CliApp.Cmd.AbstractBase<AppContext, AppContext, RootOptions> {
  constructor(ctx: AppContext) {
    super(ctx, { ...pkg, root: true, dryRun: true });
  }

  override defineOptions() {
    this.commander.option('--config <file>', 'Config file path');
  }

  override createContext(parent?: AppContext) {
    return parent ?? this.parentContext!;
  }

  override hydrateContext(opts: RootOptions) {
    if (opts.dryRun) this.ctx.dryRun = true;
  }

  override execute() {
    this.commander.help();
  }

  protected override getSubCommands() {
    return [new ProcessCommand(), new CleanCommand()];
  }
}

class ProcessCommand extends CliApp.Cmd.AbstractBase<AppContext, AppContext, ProcessOptions> {
  constructor() {
    super(undefined, { name: 'process' }); // No context in constructor
  }

  override defineOptions() {
    this.commander.argument('[files...]', 'Files to process');
    this.commander.option('--verbose', 'Verbose output');
  }

  override createContext(parent?: AppContext) {
    return parent!; // Reuse parent context
  }

  override execute(opts: ProcessOptions, args: CliApp.CmdArgs) {
    this.ctx.log.info.h1('Processing').count(args.length).text('files').emit();
  }
}
```

See [example.01.test.ts](./test/example.01.test.ts) and [example.02.test.ts](./test/example.02.test.ts) for complete working examples.

### Child Context (per-subcommand isolation)

If a subcommand needs its own isolated context (separate `pkg`, `reqId`, etc.), create a child context in `createContext()`:

```typescript
class ChildContext extends AppContext {
  processedFiles = 0;

  constructor(parent: AppContext, params?: Log.IGetChildParams) {
    super(parent, params);
    this.copyProperties(parent); // Copy custom fields from parent
  }
}

// In the subcommand:
override createContext(parent?: AppContext): ChildContext {
  return new ChildContext(parent!, { pkg: 'process' });
}
```

### Declarative Pattern

Use `CliApp.Cmd.create()` instead of subclassing for a more concise style:

```typescript
const RootCommand = CliApp.Cmd.create<AppContext, AppContext, RootOptions>(
  {
    name: pkg.name,
    description: pkg.description,
    options: {
      '--config <file>': 'Config file path',
    },
    hydrateContext: (ctx, opts) => {
      if (opts.dryRun) ctx.dryRun = true;
    },
    subCommands: {
      process: CliApp.Cmd.create<AppContext, AppContext, ProcessOptions>({
        name: 'process',
        arguments: ['[files...]'],
        options: { '--verbose': 'Verbose output' },
        action: (ctx, _opts, args) => {
          ctx.log.info.h1('Processing').count(args.length).text('files').emit();
        },
      }),
    },
  },
  { root: true },
);
```

See [example.03.test.ts](./test/example.03.test.ts) for a complete working example.

### Built-in Logging Options

Root commands (with `root: true`) automatically include:

| Flag | Effect |
|------|--------|
| `--log-level <level>` | Set threshold (FATAL, CRITICAL, ERROR, WARN, INFO, VERBOSE, DEBUG, TRACE, SPAM, SILLY) |
| `--verbose` | Shortcut for verbose level |
| `-D, --debug` | Shortcut for debug level |
| `-T, --trace` | Shortcut for trace level |
| `-S, --spam` | Shortcut for spam level |
| `--log-show [props]` | Show log metadata fields (pkg, level, time, reqId, sid) |
| `-A, --log-show-all` | Show all metadata fields |
| `--no-color` | Disable ANSI colors |
| `-n, --dry-run` | Enable dry-run mode (only if `dryRun: true` in constructor params) |

### Context Flow

Each command has access to three context properties:

- **`grandpaContext`** — The initial context passed to the root command constructor. Never changes.
- **`parentContext`** — The hydrated context from the parent command. Set by the parent's preAction hook.
- **`ctx`** — This command's own context. Created during the preAction hook by `createContext()`.

Use `activeContext()` to get the youngest available context at any point.

### Command Lifecycle

| Method | When called | Contexts available |
|--------|------------|-------------------|
| `constructor()` | On creation | `grandpaContext` |
| `defineMetadata()` | During `init()` | `grandpaContext`, `parentContext` (root) |
| `defineOptions()` | During `init()` | `grandpaContext`, `parentContext` (root) |
| `getSubCommands()` | During `init()` | `grandpaContext`, `parentContext` (root) |
| `createContext(parent)` | preAction hook | `grandpaContext`, `parentContext` |
| `hydrateContext(opts, args)` | preAction hook | `grandpaContext`, `parentContext`, `ctx` |
| `execute(opts, args)` | After parsing | `grandpaContext`, `parentContext`, `ctx` |

All methods are optional — override only what you need.

## API Reference

### `Ctx.AbstractBase`

Base context class that all application contexts extend.

**Key properties:**
- `log` — The logger instance
- `logMgr` — The log manager (set threshold, add transports)
- `dryRun` — Dry-run flag
- `pkg` — Package metadata

**Key methods:**
- `setupLogging(levelOrParams?, params?)` — Initialize logging. Must be called on the root context before `run()`.
- `copyProperties(parent)` — Copy custom fields from a parent context. Call in child context constructors.
- `close()` — Flush and close the logger. Called automatically by `run()`.

### `Cmd.AbstractBase`

Base class for all commands.

**Constructor params:**
- `initialContext` — For root commands: the pre-constructed context. For subcommands: pass `undefined`.
- `params.root` — Set `true` on the root command to enable logging options and version flag.
- `params.dryRun` — Set `true` to include the `--dry-run` flag.
- `params.name`, `params.description`, `params.version` — Command metadata.

**Lifecycle methods (override as needed):**
- `defineMetadata()` — Set command name, description, aliases
- `defineOptions()` — Define CLI options and arguments via `this.commander`
- `createContext(parent?)` — Return context for this command level
- `hydrateContext(options, args)` — Apply parsed options to context
- `execute(options, args)` — Run command logic
- `getSubCommands()` — Return array of subcommand instances

**Helper methods:**
- `option(flags, description)` — Fluent option builder (alternative to `this.commander.option()`)
- `argument(flags, description)` — Fluent argument builder
- `addHelpText(text, position?)` — Add custom help text
- `activeContext()` — Get youngest available context

### `run(ctx, command, options?)`

Entry point that handles the full application lifecycle:
- Calls `command.init()` and `command.commander.parseAsync()`
- Handles SIGINT (Ctrl-C) for graceful shutdown
- Catches errors, logs them (with stack trace at debug level)
- Calls `ctx.close()` for resource cleanup
- Calls `Deno.exit()` (pass `{ noExit: true }` to suppress, e.g., in tests)

### `BaseClass`

Optional helper for application service classes. Extend it to get direct log-level getters without re-declaring generics throughout the codebase:

```typescript
// Define once
export abstract class Base extends CliApp.BaseClass<AppContext, AppBuilder, AppLogger> {}

// Use in all service classes — no generics needed
class MyService extends Base {
  process() {
    this.info.text('Starting').emit();
    this.debug.fileOp('WRITE', path).emit();
  }
}
```

## Examples

All examples are runnable with `deno run -A`:

| File | Demonstrates |
|------|-------------|
| [example.01.test.ts](./test/example.01.test.ts) | Class-based pattern with subcommands and child context |
| [example.02.test.ts](./test/example.02.test.ts) | Custom MsgBuilder, dry-run, multiple subcommands |
| [example.03.test.ts](./test/example.03.test.ts) | Fully declarative pattern |
| [example.04.test.ts](./test/example.04.test.ts) | Custom MsgBuilder extending `Console.Builder` directly |

The [demo package](../demo/) shows a production-grade application with MCP server support.

## License

MIT
