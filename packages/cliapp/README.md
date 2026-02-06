# @epdoc/cliapp

Type-safe CLI framework with automatic context flow, built on Commander.js and integrated with @epdoc/logger.

## Features

- **Automatic Context Flow** - Parent context flows to child commands automatically
- **Class-Based or Declarative** - Choose your style or mix both
- **Built-in Logging** - Integrated @epdoc/logger with automatic configuration
- **Type-Safe** - Full TypeScript support with generic constraints
- **Production Ready** - Error handling, signal management, and cleanup

## Installation

```bash
deno add @epdoc/cliapp @epdoc/logger @epdoc/msgbuilder
```

## Quick Start - Class-Based

```typescript
import * as CliApp from '@epdoc/cliapp';
import pkg from './deno.json' with { type: 'json' };

// Define contexts
class RootContext extends CliApp.Context {
  apiUrl = '';

  setupLogging() {
    this.logMgr = new Log.Mgr<CliApp.Ctx.MsgBuilder>();
    this.logMgr.initLevels();
    this.log = this.logMgr.getLogger<CliApp.Ctx.Logger>();
  }
}

class ChildContext extends RootContext {
  processedFiles = 0;
  
  constructor(parent: RootContext, params?: Log.IGetChildParams) {
    super(parent, params);
    this.apiUrl = parent.apiUrl; // Inherit from parent
  }
}

// Define commands
class RootCommand extends CliApp.BaseCommand<RootContext, RootContext> {
  constructor(ctx: RootContext) {
    super(undefined, ctx, true); // Mark as root
  }

  defineMetadata() {
    this.commander.name(pkg.name);
    this.commander.description(pkg.description);
  }

  defineOptions() {
    this.commander.option('--api-url <url>', 'API URL');
  }

  createContext(parent?: RootContext) {
    return parent || this.parentContext!;
  }

  hydrateContext(options) {
    this.ctx.apiUrl = options.apiUrl;
  }

  execute() {
    this.commander.help();
  }

  protected override getSubCommands() {
    return [new ProcessCommand()];
  }
}

class ProcessCommand extends CliApp.BaseCommand<ChildContext, RootContext> {
  defineMetadata() {
    this.commander.name('process');
    this.commander.description('Process files');
  }

  defineOptions() {
    this.commander.argument('<files...>', 'Files to process');
  }

  createContext(parent: RootContext) {
    return new ChildContext(parent, { pkg: 'process' });
  }

  hydrateContext() {}

  execute(opts, files) {
    this.ctx.log.info.text(`Processing ${files.length} files`).emit();
    this.ctx.log.info.text(`API: ${this.ctx.apiUrl}`).emit();
  }
}

// Run
if (import.meta.main) {
  const ctx = new RootContext(pkg);
  await ctx.setupLogging();
  const cmd = new RootCommand(ctx);
  await CliApp.run(ctx, cmd);
}
```

## Quick Start - Declarative

```typescript
import * as CliApp from '@epdoc/cliapp';
import pkg from './deno.json' with { type: 'json' };

// Define contexts (same as above)
class RootContext extends CliApp.Context {
  apiUrl = '';
  setupLogging() { /* ... see above ... */ }
}

// Create commands declaratively
const RootCommand = CliApp.createCommand({
  name: pkg.name,
  description: pkg.description,
  options: {
    '--api-url <url>': 'API URL'
  },
  hydrate: (ctx, opts) => {
    ctx.apiUrl = opts.apiUrl;
  },
  subCommands: {
    process: CliApp.createCommand({
      name: 'process',
      description: 'Process files',
      arguments: ['<files...>'],
      action: (ctx, opts, ...files) => {
        ctx.log.info.text(`Processing ${files.length} files`).emit();
        ctx.log.info.text(`API: ${ctx.apiUrl}`).emit();
      }
    })
  }
});

// Run
if (import.meta.main) {
  const ctx = new RootContext(pkg);
  await ctx.setupLogging();
  const cmd = new RootCommand(ctx);
  await CliApp.run(ctx, cmd);
}
```

## Key Concepts

### Context Flow

Context automatically flows from parent to child:

1. Parent command's `hydrateContext()` runs with parent options
2. Child command's `createContext()` receives hydrated parent context
3. Child inherits parent state via constructor

### Lifecycle

Commands follow this lifecycle:

1. **Construction** - `new Command()` creates instance, sets metadata/options
2. **Metadata** - `defineMetadata()` sets name, description
3. **Options** - `defineOptions()` adds options and arguments
4. **Parsing** - Commander.js parses command line
5. **PreAction Hook** - Context created and hydrated
6. **Execution** - `execute()` runs with parsed options

### Built-in Logging

Root commands (when `isRoot` is set in constructor) automatically get:
- `--log-level <level>` - Set log threshold
- `--verbose`, `--debug`, `--trace`, `--spam` - Shortcuts
- `--log-show [props]` - Configure log output (level, pkg, etc.)
- `--no-color` - Disable ANSI color output

## Examples

See working examples in [packages/examples/](../../examples/):
- `cliapp.01.run.ts` - Class-based approach
- `cliapp.03.run.ts` - Declarative approach
- `custom.msgbuilder.run.ts` - Custom message builder example

## Generics and Variance

This library uses advanced TypeScript generics to provide type-safe access to loggers and message builders. 

### Logger Invariance

TypeScript loggers in `@epdoc/logger` are **invariant** in their message builder type. This means that a `Logger<AppBuilder>` is not assignable to a `Logger<ConsoleMsgBuilder>`, even if `AppBuilder` extends `ConsoleMsgBuilder`.

### The Workaround

To support custom message builders while maintaining a clean API, we use `any` in a few specific internal type constraints (specifically in `Context` and `ICtx`). This is a intentional technical decision to work around TypeScript's invariance rules.

Specifically, the `Context` class is defined with `L extends Log.Std.Logger<any>`. This allows the context to accept any logger implementation, but then uses conditional types (`ExtractMsgBuilder<L>`) to recover the specific builder type for use in `logMgr`.

## Running the Examples

From the `packages/examples` directory:
```bash
deno run -A cliapp.01.run.ts --help
deno run -A cliapp.01.run.ts --root-option process --sub-option file1.txt
```

## API Reference

### BaseCommand

Abstract class for creating commands.

**Abstract Methods:**
- `defineMetadata()` - Set command name, description, version
- `defineOptions()` - Add options and arguments
- `createContext(parent?)` - Create context instance
- `hydrateContext(options)` - Populate context from parsed options
- `execute(options, args)` - Run command logic

**Override Methods:**
- `getSubCommands()` - Return array of subcommand instances (called during registration)

### createCommand(node)

Factory function to create commands from declarative configuration.

**CommandNode Properties:**
- `name` - Command name
- `description` - Command description
- `options` - Object mapping flags to descriptions
- `arguments` - Array of argument specifications
- `hydrate(ctx, opts)` - Hydrate context callback
- `action(ctx, opts, ...args)` - Command action
- `subCommands` - Object mapping names to subcommands

### Context

Abstract base context class with logging support.

**Constructor:**
- `new Context(pkg)` - Create root context
- `new Context(parent, params?)` - Create child context

**Methods:**
- `setupLogging()` - Initialize logging (must be implemented by root)
- `close()` - Gracefully shut down logging and resources

**Properties:**
- `log` - Logger instance
- `logMgr` - Log manager
- `pkg` - Package metadata (deno.json)

### run(ctx, command | appFn, options?)

Run application with lifecycle management. Handles SIGINT and errors.

## License

MIT
