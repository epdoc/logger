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

## Quick Start

### Class-Based Pattern

```typescript
import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import pkg from './deno.json' with { type: 'json' };

class AppContext extends CliApp.Context {
  override async setupLogging() {
    // Root contexts MUST initialize logMgr and log with appropriate generics
    this.logMgr = new Log.Mgr<CliApp.Ctx.MsgBuilder>();
    this.log = await this.logMgr.getLogger<CliApp.Ctx.Logger>();
  }
}

class RootCommand extends CliApp.BaseCommand<AppContext, AppContext> {
  override execute() {
    this.ctx.log.info.text('Hello World').emit();
  }
}

if (import.meta.main) {
  const ctx = new AppContext(pkg);
  await ctx.setupLogging();
  await CliApp.run(ctx, new RootCommand(ctx));
}
```

### Declarative Pattern

```typescript
const HelloCmd = CliApp.createCommand({
  name: 'hello',
  action: (ctx) => ctx.log.info.text('Hello').emit(),
});
```

---

## Guide: Building a CLI Step-by-Step

### 1. The Context Layer

The **Context** object is passed from the root application down through every subcommand.

#### The Root Context

The root context MUST implement `setupLogging()`.

> [!IMPORTANT]
> The abstract `Context` class does NOT initialize `logMgr` by default. You must do this in your root context's
> `setupLogging` method using the appropriate generics for your logger and message builder.

```typescript
import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';

type M = Console.Builder;
type L = Log.Std.Logger<M>;

export class AppContext extends CliApp.Context<L> {
  // Shared state
  public apiUrl: string = 'https://api.example.com';

  override async setupLogging() {
    this.logMgr = new Log.Mgr<M>();
    // Configure transports here
    this.log = await this.logMgr.getLogger<L>();
  }
}
```

#### Context Refinement (Optional)

Refinement is **completely optional**. If a subcommand doesn't implement `createContext`, it simply reuses the parent's
context object.

### 2. The Main Entry Point (`main.ts`)

```typescript
import * as CliApp from '@epdoc/cliapp';
import { AppContext } from './src/context.ts';
import { RootCommand } from './src/cmds/root.ts';
import pkg from './deno.json' with { type: 'json' };

if (import.meta.main) {
  const ctx = new AppContext(pkg);
  await ctx.setupLogging();
  const rootCmd = new RootCommand(ctx);
  await CliApp.run(ctx, rootCmd);
}
```

### 3. Creating the Root Command

Passing `root: true` to the constructor enables global flags like `--log-level` and `--no-color`.

```typescript
export class RootCommand extends CliApp.BaseCommand<AppContext, AppContext> {
  constructor(ctx: AppContext) {
    super(ctx, {
      name: 'myapp',
      version: pkg.version,
      root: true,
    });
  }

  override defineOptions() {
    this.commander.option('-u, --url <url>', 'Override API URL');
  }

  override hydrateContext(options: any) {
    if (options.url) this.ctx.apiUrl = options.url;
  }

  override execute() {
    this.commander.help();
  }

  protected override getSubCommands() {
    return [new SyncCommand()];
  }
}
```

### 4. Subcommand Reuse

A command class is decoupled from its hierarchy. The parent command determines if it's a root or a child.

```typescript
export class SyncCommand extends CliApp.BaseCommand<AppContext, AppContext> {
  constructor(ctx?: AppContext) {
    super(ctx, { name: 'sync', description: 'Synchronize data' });
  }

  override execute() {
    this.ctx.log.info.text('Syncing with ').text(this.ctx.apiUrl).emit();
  }
}
```

---

## Key Concepts

### Context Flow

1. Parent command's `hydrateContext()` runs with parsed options.
2. Child command's `createContext()` receives the hydrated parent context.
3. Child inherits state via its own constructor if needed.

### Lifecycle

1. **Construction**: Sets metadata and options.
2. **Parsing**: Commander.js parses the CLI.
3. **PreAction Hook**: Context is created and hydrated.
4. **Execution**: `execute(options, args)` runs.

### Built-in Logging

Root commands automatically receive:

- `--log-level <level>`: error, warn, info, debug, trace, spam.
- `--verbose`, `--debug`: level shortcuts.
- `--no-color`: Disables ANSI colors.
- `--dry-run`: Sets `ctx.dryRun = true`.

---

## API Reference

### BaseCommand<TContext, TParentContext>

- `defineMetadata()`: Set name, description, version.
- `defineOptions()`: Add commander options/arguments.
- `createContext(parent?)`: Create context instance.
- `hydrateContext(options)`: Map options to context.
- `execute(options, args)`: Run command logic.
- `getSubCommands()`: Return array of subcommand instances.

### createCommand(node)

Factory for creating commands from a declarative `CommandNode`.

### run(ctx, command | appFn, options?)

The entry point that handles SIGINT, error logging, and cleanup.

---

## Examples

See verified examples in [test/](./test/):

- [example.01.test.ts](./test/example.01.test.ts) - **Class-Based Pattern**
- [example.02.test.ts](./test/example.02.test.ts) - **Advanced Logging & Dry-Run**
- [example.03.test.ts](./test/example.03.test.ts) - **Declarative Pattern**
- [example.04.test.ts](./test/example.04.test.ts) - **Custom Message Builders**

## License

MIT
