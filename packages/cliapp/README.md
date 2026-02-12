# @epdoc/cliapp

Type-safe CLI framework with automatic context flow, built on Commander.js and integrated with @epdoc/logger.

## Features

- **Automatic Context Flow** - Parent context flows to child commands automatically
- **Type-Safe** - Full TypeScript support with generic constraints
- **Built-in Logging** - Integrated @epdoc/logger with automatic configuration
- **Custom Message Builders** - Extend logging with application-specific formatting
- **Production Ready** - Error handling, signal management, and cleanup

## Installation

```bash
deno add @epdoc/cliapp @epdoc/logger @epdoc/msgbuilder
```

## Quick Start

See the **[complete tutorial in the demo package](../demo/README.md)** for step-by-step instructions.

### Minimal Example

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
    this.option('-f, --force', 'Force operation').emit();
  }

  override execute(opts: CliApp.CmdOptions) {
    this.log.info.text('Hello World').emit();
  }
}

// 3. Run
if (import.meta.main) {
  const ctx = new AppContext(pkg);
  await ctx.setupLogging({ pkg: 'app' });
  const rootCmd = new RootCommand(ctx);
  await rootCmd.init();
  CliApp.run(ctx, rootCmd);
}
```

## Documentation

- **[Complete Tutorial](../demo/README.md)** - Step-by-step guide with working examples
- **[Design Decisions](./DESIGN.md)** - Technical architecture notes
- **[Test Examples](./test/)** - Verified working examples

## Key Concepts

### Context Flow

Each command has access to three context properties:

- **`grandpaContext`** - Initial context from constructor (never changes)
- **`parentContext`** - Parent's hydrated context (set during preAction hook)
- **`ctx`** - Command's own context (created during preAction hook)

### Command Lifecycle

1. **constructor** - Initialize with context
2. **defineMetadata()** - Set name, description, aliases
3. **defineOptions()** - Define CLI options and arguments
4. **createContext()** - Create or reuse context (preAction hook)
5. **hydrateContext()** - Apply parsed options to context (preAction hook)
6. **execute()** - Run command logic

### Context Availability

| Method             | Available Contexts                            |
| ------------------ | --------------------------------------------- |
| `constructor()`    | `grandpaContext`                              |
| `defineMetadata()` | `grandpaContext`, `parentContext` (root only) |
| `defineOptions()`  | `grandpaContext`, `parentContext` (root only) |
| `getSubCommands()` | `grandpaContext`, `parentContext` (root only) |
| `createContext()`  | `grandpaContext`, `parentContext`             |
| `hydrateContext()` | `grandpaContext`, `parentContext`, `ctx`      |
| `execute()`        | `grandpaContext`, `parentContext`, `ctx`      |

Use `activeContext()` to get the youngest available context at any point.

### Built-in Logging Options

Root commands automatically include:

- `--log-level <level>` - Set threshold (FATAL, ERROR, WARN, INFO, DEBUG, TRACE, SPAM)
- `-D, --debug` - Shortcut for debug level
- `-T, --trace` - Shortcut for trace level
- `-S, --spam` - Shortcut for spam level
- `--log-show [props]` - Show log properties (pkg, level, time, reqId, sid)
- `-A, --log-show-all` - Show all log properties
- `--no-color` - Disable ANSI colors
- `-n, --dry-run` - Enable dry-run mode (if `dryRun: true` in constructor)

## API Reference

### AbstractBase (Context)

Base context class that all contexts extend.

**Key Methods:**

- `setupLogging(levelOrParams?, params?)` - Initialize logging for root context
- `getChild(params)` - Create child context (inherited from logger)
- `close()` - Cleanup and close logger

### AbstractCommand (Command)

Base command class for all commands.

**Lifecycle Methods:**

- `defineMetadata()` - Set command metadata
- `defineOptions()` - Define CLI options/arguments
- `createContext(parent?)` - Create context instance
- `hydrateContext(options, args)` - Apply options to context
- `execute(options, args)` - Run command logic
- `getSubCommands()` - Return subcommand instances

**Helper Methods:**

- `option(flags, description)` - Add option (returns fluent builder)
- `argument(flags, description)` - Add argument (returns fluent builder)
- `addHelpText(text, position?)` - Add custom help text
- `activeContext()` - Get youngest available context

### run(ctx, command, options?)

Entry point that handles initialization, parsing, error handling, and cleanup.

**Parameters:**

- `ctx` - Root context
- `command` - Root command instance
- `options` - Optional configuration (e.g., `{ noExit: true }` for testing)

## Examples

Working examples in [test/](./test/):

- [example.01.test.ts](./test/example.01.test.ts) - Basic class-based pattern
- [example.02.test.ts](./test/example.02.test.ts) - Advanced logging & dry-run
- [example.03.test.ts](./test/example.03.test.ts) - Declarative pattern
- [example.04.test.ts](./test/example.04.test.ts) - Custom message builders

## Complete Tutorial

For a comprehensive guide with working code, see the **[demo package README](../demo/README.md)**.

## License

MIT
