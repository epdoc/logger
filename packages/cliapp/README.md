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

```typescript A
import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
const pkg = { name: 'myapp', version: '1.0.0', description: 'My app' };

class AppOptions extends CliApp.CmdOptions {
  force?: boolean;
}

class AppContext extends CliApp.Context {
  override async setupLogging() {
    // Root contexts MUST initialize logMgr and log with appropriate generics
    this.logMgr = new Log.Mgr<CliApp.Ctx.MsgBuilder>();
    this.log = await this.logMgr.getLogger<CliApp.Ctx.Logger>();
  }
}

class RootCommand extends CliApp.BaseCommand<AppContext, AppContext, CliApp.CmdOptions> {
  constructor(ctx: AppContext) {
    super(ctx, { name: 'myapp', root: true, version: pkg.version });
  }

  override createContext(parent?: AppContext): AppContext {
    return parent || this.parentContext!;
  }

  override async defineOptions(): Promise<void> {
    this.commander.option('-f, --force', 'Force operation');
    this.commander.argument('[files...]', 'Files to process');
    await Promise.resolve();
  }

  override execute(opts: AppOptions, args: string[]) {
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

```typescript A
const node: CliApp.CommandNode<AppContext> = {
  action: (ctx) => {
    ctx.log.info.text('Hello').emit();
  },
};

const RootCmd = CliApp.createCommand(node, { ...pkg, root: true });
```

---

## Guide: Building a CLI Step-by-Step

### 0. Creating your Project

### 1. The Context Layer

The **Context** object is passed from the root application down through every subcommand.

#### The Root Context

The root context MUST implement `setupLogging()`.

> [!IMPORTANT]
> The abstract `Context` class does NOT initialize `logMgr` by default. You must do this in your root context's
> `setupLogging` method using the appropriate generics for your logger and message builder.

```typescript B
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

```typescript C
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

```typescript C
export class RootCommand extends CliApp.BaseCommand<AppContext, AppContext, CliApp.CmdOptions> {
  constructor(ctx: AppContext) {
    super(ctx, {
      name: 'myapp',
      version: pkg.version,
      root: true,
    });
  }

  override async defineOptions(): Promise<void> {
    await Promise.resolve();
    this.commander.option('-u, --url <url>', 'Override API URL');
  }

  override hydrateContext(options: CliApp.CmdOptions) {
    if (options.url) this.ctx.apiUrl = options.url as string;
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

```typescript C
export class SyncCommand extends CliApp.BaseCommand<AppContext, AppContext, CliApp.CmdOptions> {
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

### Context Flow and Hierarchy

Each command has access to three context properties that become available at different stages of the command lifecycle:

- **`grandparentContext`** - The initial context passed to the constructor, never changes
- **`parentContext`** - For root commands: set to `grandparentContext` in constructor. For subcommands: set by parent's
  `preAction` hook
- **`ctx`** - The command's own context, created during the `preAction` hook

#### Context Availability by Lifecycle Stage

| Method             | Available Contexts                                |
| ------------------ | ------------------------------------------------- |
| `constructor()`    | `grandparentContext`                              |
| `defineMetadata()` | `grandparentContext`, `parentContext` (root only) |
| `defineOptions()`  | `grandparentContext`, `parentContext` (root only) |
| `getSubCommands()` | `grandparentContext`, `parentContext` (root only) |
| `createContext()`  | `grandparentContext`, `parentContext`             |
| `hydrateContext()` | `grandparentContext`, `parentContext`, `ctx`      |
| `execute()`        | `grandparentContext`, `parentContext`, `ctx`      |

#### Using `activeContext()`

The `activeContext()` method returns the youngest available context at any point in the lifecycle:

```typescript
override defineOptions() {
  const ctx = this.activeContext()!; // Returns grandparentContext for subcommands
  ctx.log.info.text('Defining options').emit();
}
```

Use `instanceof` to verify the context type if needed:

```typescript
const ctx = this.activeContext();
if (ctx instanceof MyCustomContext) {
  // Use custom context features
}
```

#### Passing Context to Subcommands

In `getSubCommands()`, pass `this.parentContext` to subcommand constructors:

```typescript
protected override getSubCommands() {
  return [
    new SubCommand(this.parentContext),
    new AnotherCommand(this.parentContext)
  ];
}
```

The framework will later call `setParentContext()` on each subcommand during the parent's `preAction` hook, giving them
access to the parent's hydrated context.

#### Context Flow Example

1. Root command receives initial context in constructor → stored as `grandparentContext`
2. Root command sets `parentContext = grandparentContext` (no parent to call `setParentContext()`)
3. Root's `preAction` creates `ctx` via `createContext(parentContext)`
4. Root's `preAction` calls `subcommand.setParentContext(this.ctx)` on each child
5. Subcommand's `preAction` creates its own `ctx` via `createContext(parentContext)`

### Lifecycle

1. **Construction**: Basic Commander.js setup and parameter storage.
2. **init()**: (Async) Recursive call to `defineMetadata()`, `defineOptions()`, and subcommand registration.
3. **CliApp.run()**: Orchestrates initialization and calls `commander.parseAsync()`.
4. **PreAction Hook**: Context creation and hydration.
5. **Execution**: `execute(options, args)` runs command logic.

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
