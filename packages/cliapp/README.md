# @epdoc/cliapp

Type-safe CLI framework supporting commander.js-based command hierarchies, with integrated logging, context flow, and
MCP server support.

## Features

- **Builds on Commander.js** — Supports everything that [Commander.js](https://github.com/tj/commander.js) supports
- **Built-in Logging** — Integrated [@epdoc/logger](../logger/README.md) with automatic configuration
- **Custom Message Builders** — Extend message formatting with application-specific methods
- **Automatic MCP Support** — Commands exposed via [MCP](https://modelcontextprotocol.io/docs/getting-started/intro) for
  use by AI, with no extra work. MCP support is in an alpha state and not robust.
- **Context Flow** — Parent context flows to child commands automatically
- **Type-Safe** — Full TypeScript support with generic constraints
- **Production Ready** — Error handling, signal management, and cleanup
- **Progress Spinners** - Supports progress bars and spinners, fully integrated with log messaging.
- **Nested Progress** - Start multiple progress levels; parent messages are restored when children complete.
- **"Using" Pattern** - Automatic progress cleanup with TypeScript's `using` declaration.
- **Command Runner** - Typed wrapper around `Deno.Command` for running external processes with captured or inherited
  output.
- **TextBuilder** — Utility to accumulate multiple lines of formatted text in memory using MsgBuilder before
  logging/printing.

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
    super(ctx, { root: true });
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

> **Note:** Root commands automatically inherit `name`, `version`, and `description` from the context's `pkg` metadata
> (loaded from `deno.json`). The `@scope/` prefix is stripped from the name. You only need `{ root: true }` — no need to
> spread `pkg` into the constructor params.

## Documentation

- **[AI Reference](./AI.md)** — Quick reference for AI assistants (concise, token-efficient)
- **[Setup Guide](https://github.com/anomalyco/opencode/blob/main/skills/cliapp-setup/SKILL.md)** — Complete setup guide
  with step-by-step examples
- **[Design Decisions](./DESIGN.md)** — Technical architecture notes
- **[Test Examples](./test/)** — Verified working examples (see below)
- **[Demo App](../demo/)** — Production-grade CLI with MCP support

## Key Concepts

### Context

The context is the central state object passed through the entire command tree. It holds the logger, log manager,
dry-run flag, and any application-specific state.

All contexts extend `CliApp.Ctx.AbstractBase`. You must call `setupLogging()` on the root context before calling
`run()`.

```typescript
class AppContext extends CliApp.Ctx.AbstractBase {
  // Add app-specific state
  configFile?: string;
}

const ctx = new AppContext(pkg);
await ctx.setupLogging({ pkg: 'app' });
```

### Custom Message Builder

To add application-specific log formatting methods, extend `Console.Builder` (or `CliApp.Ctx.MsgBuilder`) and set
`builderClass`:

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

#### Theming and Colors

You can customize the color theme for your CLI application:

```typescript
import { Console } from '@epdoc/msgbuilder';

// Use standard ANSI colors for broader terminal compatibility
Console.Builder.styleFormatters = Console.styleFormattersV0;

// Or use the higher-contrast V1 theme
Console.Builder.styleFormatters = Console.styleFormattersV1;
```

For message content styling, see [@epdoc/msgbuilder theming](../msgbuilder/README.md#theming-and-colors). For console
transport column styling (session ID, request ID, etc.), see
[@epdoc/logger theming](../logger/README.md#console-transport-column-styling).

### Commands with Subcommands

Override `getSubCommands()` to return subcommand instances. Subcommands do not receive a context in their constructor —
they receive the parent's hydrated context via `setParentContext()` during the preAction hook.

```typescript
class RootCommand extends CliApp.Cmd.AbstractBase<AppContext, AppContext, RootOptions> {
  constructor(ctx: AppContext) {
    super(ctx, { root: true, dryRun: true }); // name, version, description come from ctx.pkg
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

See [example.01.test.ts](./test/example.01.test.ts) and [example.02.test.ts](./test/example.02.test.ts) for complete
working examples.

### Child Context (per-subcommand isolation)

If a subcommand needs its own isolated context (separate `pkg`, `reqId`, etc.), create a child context in
`createContext()`:

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

| Flag                  | Effect                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------- |
| `--log-level <level>` | Set threshold (FATAL, CRITICAL, ERROR, WARN, INFO, VERBOSE, DEBUG, TRACE, SPAM, SILLY) |
| `--verbose`           | Shortcut for verbose level                                                             |
| `-D, --debug`         | Shortcut for debug level                                                               |
| `-T, --trace`         | Shortcut for trace level                                                               |
| `-S, --spam`          | Shortcut for spam level                                                                |
| `--log-show [props]`  | Show log metadata fields (pkg, level, time, reqId, sid)                                |
| `-A, --log-show-all`  | Show all metadata fields                                                               |
| `--no-color`          | Disable ANSI colors                                                                    |
| `-n, --dry-run`       | Enable dry-run mode (only if `dryRun: true` in constructor params)                     |

### Progress Indicators

Use `CliApp.Progress.MsgBuilder` for interactive progress bars and spinners that work seamlessly with logging:

```typescript
class AppContext extends CliApp.Ctx.AbstractBase {
  protected override builderClass = CliApp.Progress.MsgBuilder;
}

// In your command:
async execute(): Promise<void> {
  // Start a spinner
  ctx.log.info.text('Processing files').start({ type: 'spinner', color: 'cyan' });
  await processFiles();
  ctx.log.info.icheck().text('Done!').complete();
}
```

**Nested Progress** — Start a new progress while another is running:

```typescript
// Parent progress
ctx.log.info.text('Building project').start();

// Nested: child progress temporarily replaces parent message
ctx.log.info.text('  Compiling TypeScript').start();
await compileTypeScript();
ctx.log.info.text('  Compiled ✓').complete(); // Restores "Building project"

// Another nested operation
ctx.log.info.text('  Bundling assets').start();
await bundleAssets();
ctx.log.info.text('  Bundled ✓').complete(); // Restores "Building project"

// Complete parent
ctx.log.info.icheck().text('Build complete!').complete();
```

**"Using" Pattern** — Automatic cleanup with TypeScript's `using` declaration:

```typescript
{
  // Progress automatically completes when exiting the block
  using _progress = ctx.log.info.text('Processing').start();
  await doWork(); // complete() called automatically here
}

// Equivalent to:
const progress = ctx.log.info.text('Processing').start();
try {
  await doWork();
} finally {
  progress.complete();
}
```

**Progress Types** — Choose from `spinner`, `bounce`, `horizontal` bar, or `vertical` fill:

```typescript
// Spinner for indeterminate progress
ctx.log.info.start({ type: 'spinner', index: 0, color: 'cyan' });

// Progress bar for determinate progress
ctx.log.info.start({
  type: 'horizontal',
  total: 100,
  width: 30,
  color: 'green',
});
ctx.log.info.update(50); // Update to 50%
```

**Cross-Level Updates** — Higher log levels can update the progress line:

```typescript
ctx.log.info.text('Processing').start();
// ... later, a warning occurs:
ctx.log.warn.text('Warning: slow connection').emit(); // Briefly updates progress line
ctx.log.info.text('Still processing').update(); // Back to normal
ctx.log.info.complete();
```

**Level Constraints** — Control when progress vs regular log messages are used:

Use the `level` option in `start()` to specify which log level should trigger progress mode. If the specified level does
not match the current threshold, `start()` emits a regular log message instead of showing a progress indicator. This is
useful for creating progress indicators that only display at specific log levels.

```typescript
// Progress only shows when threshold is 'info'
ctx.log.info.text('Building project').start({ level: 'info' });

// Verbose details emit as regular logs (won't affect the progress line)
ctx.log.verbose.text('  Parsing files...').emit();
ctx.log.verbose.text('  Compiling...').emit();

// Complete the progress (or emit if no progress was started)
ctx.log.info.text('Build complete').stop();
```

With `threshold = 'info'`, the above shows a progress line that updates in place. With `threshold = 'verbose'`, all
messages emit as regular logs since the `level: 'info'` constraint doesn't match.

```typescript
// Mixed levels with constraints at verbose threshold
ctx.log.info.text('Starting build').start({ level: 'info' }); // Emits (constraint mismatch)
ctx.log.verbose.text('  Compiling TypeScript').start({ level: 'verbose' }); // Progress
ctx.log.verbose.text('    Parsed 100 files').emit();
ctx.log.verbose.text('  Compiled').complete(); // Complete the verbose progress
ctx.log.info.text('Build finished').stop(); // Emits (no active progress to complete)
```

### TextBuilder

Use `CliApp.TextBuilder` to construct multi-line formatted text blocks before displaying or saving them. It allows you
to build lines using the custom/default message builder, but instead of logging immediately, they are stored in memory
and compiled on demand.

It also supports persistent indentation levels (`indent()`, `outdent()`, `nodent()`) that automatically apply to all
subsequent lines.

```typescript
import * as CliApp from '@epdoc/cliapp';

// Build text using the standard MsgBuilder
const tb = new CliApp.TextBuilder();

tb.line.h2('Header 2');
tb.indent(); // Increase indent (defaults to 2 spaces)
tb.line.text('Key:').bold('Value');
tb.indent(); // Increase indent again (total 4 spaces)
tb.line.text('Nested item');
tb.outdent(); // Decrease indent back to 2 spaces
tb.line.text('Another item');
tb.nodent(); // Reset all indentation to root
tb.nl();
tb.line.text('Done!');

console.log(tb.emit());
// Output:
// Header 2
//   Key: Value
//     Nested item
//   Another item
//
// Done!
```

You can also use custom `MsgBuilder` types by providing the builder class constructor:

```typescript
const tb = new CliApp.TextBuilder(AppBuilder);
tb.line.fileOp('WRITE', '/path/to/file');
```

### Context Flow

Each command has access to three context properties:

- **`grandpaContext`** — The initial context passed to the root command constructor. Never changes.
- **`parentContext`** — The hydrated context from the parent command. Set by the parent's preAction hook.
- **`ctx`** — This command's own context. Created during the preAction hook by `createContext()`.

Use `activeContext()` to get the youngest available context at any point.

### Command Lifecycle

| Method                       | When called     | Contexts available                       |
| ---------------------------- | --------------- | ---------------------------------------- |
| `constructor()`              | On creation     | `grandpaContext`                         |
| `defineMetadata()`           | During `init()` | `grandpaContext`, `parentContext` (root) |
| `defineOptions()`            | During `init()` | `grandpaContext`, `parentContext` (root) |
| `getSubCommands()`           | During `init()` | `grandpaContext`, `parentContext` (root) |
| `createContext(parent)`      | preAction hook  | `grandpaContext`, `parentContext`        |
| `hydrateContext(opts, args)` | preAction hook  | `grandpaContext`, `parentContext`, `ctx` |
| `execute(opts, args)`        | After parsing   | `grandpaContext`, `parentContext`, `ctx` |

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
- `params.name`, `params.description`, `params.version` — Command metadata. For root commands, these automatically fall
  back to `ctx.pkg` if not provided (name has `@scope/` stripped). This means `{ root: true }` is typically sufficient.

**Metadata resolution order** (highest priority first):

1. `defineMetadata()` — programmatic overrides via setters
2. Constructor params — values passed to `super(ctx, { ... })`
3. `ctx.pkg` — automatic fallback from `deno.json` (root commands only)

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

Optional helper for application service classes. Extend it to get direct log-level getters without re-declaring generics
throughout the codebase:

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

### `runCommand(cmd, args, opts?)`

Execute an external command with typed result handling.

```typescript
import { type CommandResult, runCommand } from '@epdoc/cliapp/runner';

// Run with captured output (default)
const result = await runCommand('git', ['status'], { cwd: '/my/project' });
if (result.success) {
  console.log(result.stdout);
}

// Run interactively (inherit stdio for user interaction)
await runCommand('deno', ['publish'], { cwd: '/my/project', interactive: true });
```

**Options:**

| Option        | Type                     | Description                                                                                                                           |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `cwd`         | `string`                 | Working directory for the command (defaults to current directory)                                                                     |
| `interactive` | `boolean`                | If `true`, inherits stdin/stdout/stderr for interactive commands. If `false` (default), captures output and returns it in the result. |
| `env`         | `Record<string, string>` | Environment variables to set for the command                                                                                          |
| `clearEnv`    | `boolean`                | If `true`, clears all environment variables and only uses those specified in `env`                                                    |

**Returns:** `Promise<CommandResult>`

```typescript
interface CommandResult {
  success: boolean; // true if exit code is 0
  code: number; // the process exit code
  stdout: string; // captured stdout (empty in interactive mode)
  stderr: string; // captured stderr (empty in interactive mode)
}
```

### `runCommandOrThrow(cmd, args, opts?)`

Same as `runCommand` but throws a `CommandError` on non-zero exit code.

```typescript
import { CommandError, runCommandOrThrow } from '@epdoc/cliapp/runner';

try {
  const result = await runCommandOrThrow('git', ['push']);
  console.log('Push succeeded');
} catch (err) {
  if (err instanceof CommandError) {
    console.error('Push failed:', err.stderr);
    console.error('Exit code:', err.exitCode);
  }
}
```

### `CommandError`

Error thrown when a command exits with non-zero status. Contains the full `CommandResult` for inspection.

```typescript
try {
  await runCommandOrThrow('deno', ['eval', 'Deno.exit(1)']);
} catch (err) {
  if (err instanceof CommandError) {
    err.result; // Full CommandResult object
    err.exitCode; // The exit code (number)
    err.stdout; // Captured stdout
    err.stderr; // Captured stderr
    err.message; // Error message including command and exit code
  }
}
```

## Examples

All examples are runnable with `deno run -A`:

| File                                            | Demonstrates                                           |
| ----------------------------------------------- | ------------------------------------------------------ |
| [example.01.test.ts](./test/example.01.test.ts) | Class-based pattern with subcommands and child context |
| [example.02.test.ts](./test/example.02.test.ts) | Custom MsgBuilder, dry-run, multiple subcommands       |
| [example.03.test.ts](./test/example.03.test.ts) | Fully declarative pattern                              |
| [example.04.test.ts](./test/example.04.test.ts) | Custom MsgBuilder extending `Console.Builder` directly |

The [demo package](../demo/) shows a production-grade application with MCP server support.

## License

MIT
