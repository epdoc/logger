# @epdoc/cliapp v2.0

A clean, type-safe CLI framework with automatic context flow and declarative configuration.

## Features

- **Automatic Context Flow** - Context flows seamlessly from parent to child commands
- **Type-Safe Transformations** - Transform context types with `deriveChildContext()`
- **Declarative Configuration** - Define commands with pure configuration objects
- **Built-in Logging** - Integrated with `@epdoc/logger` for structured logging
- **Commander.js Foundation** - Built on the stable, mature Commander.js library
- **Production Ready** - Comprehensive error handling, signal management, and cleanup

## Quick Start

```typescript
import pkg from './deno.json' with { type: 'json' };
import { Command, Context, run } from '@epdoc/cliapp';

// Define your context
class AppContext extends Context {
  debugMode = false;
}

class ChildContext extends AppContext {
  processedFiles = 0;
}

// Define your commands
class RootCommand extends Command<AppContext, ChildContext> {
  protected subCommands = {
    process: ProcessCommand,
  };

  protected async deriveChildContext(ctx: AppContext): Promise<ChildContext> {
    const child = new ChildContext(ctx);
    child.debugMode = ctx.debugMode; // Flow state to child
    return child;
  }
}

class ProcessCommand extends Command<ChildContext> {
  constructor() {
    super(pkg);
    this.description('Process files');
    this.argument('<files...>', 'Files to process');
    this.option('-f, --force', 'Force processing');
  }

  action = async (files: string[], opts: any) => {
    this.ctx.log.info.text(`Processing ${files.length} files`);
    if (this.ctx.debugMode) {
      this.ctx.log.debug.text('Debug mode enabled');
    }
    // Process files...
    this.ctx.processedFiles = files.length;
  };
}

// Run your application
if (import.meta.main) {
  const ctx = new AppContext(pkg);
  await ctx.setupLogging();

  const root = new RootCommand();
  await root.init(ctx);
  root.option('--debug-mode', 'Enable debug mode');
  root.addLogging();

  await run(ctx, () => root.parseAsync());
}
```

## Core Concepts

### Context Flow

Context automatically flows from parent to child commands:

```typescript
class RootCommand extends Command<AppContext, ChildContext> {
  // Transform parent context → child context
  protected async deriveChildContext(ctx: AppContext): Promise<ChildContext> {
    const child = new ChildContext(ctx); // Inherit logging, etc.
    child.debugMode = ctx.debugMode;     // Flow specific state
    return child;
  }
}
```

### Clean API

No more painful context passing:

```typescript
// v2.0 - Clean and simple
cmd.addLogging();        // Uses this.ctx automatically
cmd.init(ctx);           // One-time context setup
this.ctx.log.info.text('Hello'); // Direct access

// v1.x - Painful repetition
cmd.addLogging(ctx);     // Pass context everywhere
cmd.init(ctx);
ctx.log.info.text('Hello');
```

### Declarative Configuration

Mix class-based and declarative approaches:

```typescript
class MyCommand extends Command<Context> {
  protected subCommands = {
    // Class-based subcommand
    advanced: AdvancedCommand,
    
    // Declarative subcommand
    simple: {
      name: 'simple',
      description: 'Simple command',
      options: {
        '--count <n>': 'Number of items'
      },
      action: (ctx, opts) => {
        ctx.log.info.text(`Count: ${opts.count}`);
      }
    }
  };
}
```

## API Reference

### Command Class

```typescript
class Command<Context, SubContext, Opts> extends Commander.Command
```

**Key Methods:**
- `init(ctx: Context): Promise<this>` - Initialize with context
- `addLogging(): this` - Add standard logging options
- `deriveChildContext(ctx, opts, args): Promise<SubContext>` - Transform context

**Properties:**
- `ctx: Context` - Current context instance
- `subCommands` - Declarative subcommand mapping

### Context Class

```typescript
class Context implements ICtx
```

**Key Methods:**
- `setupLogging(level?: string): Promise<void>` - Setup logging for root context
- `close(): Promise<void>` - Cleanup resources

**Properties:**
- `log: Logger` - Logger instance
- `logMgr: Log.Mgr` - Log manager
- `pkg: DenoPkg` - Package metadata

### Run Function

```typescript
function run(ctx: ICtx, appFn: () => Promise<unknown>, options?: { noExit?: boolean }): Promise<void>
```

Provides comprehensive application lifecycle management with error handling, signal management, and cleanup.

## Migration from v1.x

See [MIGRATION.md](./MIGRATION.md) for detailed migration guide.

## License

MIT
