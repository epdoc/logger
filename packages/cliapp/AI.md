# @epdoc/cliapp -- AI Reference

Type-safe CLI framework for commander.js-based command hierarchies with integrated logging and MCP support. MCP support
is not robust.

**Purpose**: Build CLI applications with automatic context inheritance and type-safe commands.

---

## Core Concepts

### Three Things to Define

1. **Context** — extends `CliApp.Ctx.AbstractBase`. Holds `log`, `logMgr`, `dryRun`, `pkg`.
2. **Commands** — extend `CliApp.Cmd.AbstractBase`. Override lifecycle methods.
3. **Entry Point** — construct context, call `setupLogging()`, construct root command, call `CliApp.run()`.

### Architecture

```
main.ts
    |
    v
new AppContext(pkg) → ctx.setupLogging() → new RootCommand(ctx) → CliApp.run(ctx, cmd)
                                                    |
                                                    v
                                    init() → defineOptions() → parse() → preAction hook
                                                                                |
                                                                                v
                                    createContext() → hydrateContext() → execute()
```

---

Hint: Use [template](../template/README.md) for a faster start.

## Context (Ctx.AbstractBase)

```typescript
// Minimal context
class AppContext extends CliApp.Ctx.AbstractBase {}

// With custom MsgBuilder
class AppBuilder extends Console.Builder { customMethod() { ... } }
type AppLogger = Log.Std.Logger<AppBuilder>;
class AppContext extends CliApp.Ctx.AbstractBase<AppBuilder, AppLogger> {
  protected override builderClass = AppBuilder;  // REQUIRED for custom builders
}

// Usage
const ctx = new AppContext(pkg);
await ctx.setupLogging({ pkg: 'app' });  // Must call before run()
```

**Key Properties:** `log`, `logMgr`, `dryRun`, `pkg`, `mcpResult?`

**Child Context Pattern:**

```typescript
class ChildContext extends AppContext {
  customField = 0;
  constructor(parent: AppContext, params?: Log.IGetChildParams) {
    super(parent, params);
    this.copyProperties(parent); // Copy custom fields
  }
}
```

---

## Commands (Cmd.AbstractBase)

### Lifecycle Methods (override as needed)

| Method                       | When Called | Contexts Available                            |
| ---------------------------- | ----------- | --------------------------------------------- |
| `constructor()`              | Creation    | `grandpaContext`                              |
| `defineMetadata()`           | `init()`    | `grandpaContext`, `parentContext` (root only) |
| `defineOptions()`            | `init()`    | `grandpaContext`, `parentContext` (root only) |
| `getSubCommands()`           | `init()`    | `grandpaContext`, `parentContext` (root only) |
| `createContext(parent)`      | preAction   | `grandpaContext`, `parentContext`             |
| `hydrateContext(opts, args)` | preAction   | All contexts                                  |
| `execute(opts, args)`        | After parse | All contexts                                  |

### Root Command Pattern

```typescript
class RootCommand extends CliApp.Cmd.AbstractBase<AppContext, AppContext, RootOptions> {
  constructor(ctx: AppContext) {
    super(ctx, { root: true, dryRun: true }); // name/version/description from ctx.pkg
  }

  override defineOptions(): void {
    this.option('-c, --config <file>', 'Config file').default('config.json').emit();
    this.argument('[files...]', 'Files to process').emit();
  }

  override hydrateContext(opts: RootOptions): void {
    if (opts.dryRun) this.ctx.dryRun = true;
  }

  protected override getSubCommands() {
    return [new ProcessCommand()];
  }
}
```

### Subcommand Pattern

```typescript
class ProcessCommand extends CliApp.Cmd.AbstractBase<AppContext, AppContext, ProcessOptions> {
  constructor() {
    super(undefined, { name: 'process' }); // No context in constructor
  }

  override createContext(parent?: AppContext): AppContext {
    return parent!; // Reuse parent (default)
    // Or: return new ChildContext(parent!, { pkg: 'process' });
  }

  override execute(opts: ProcessOptions, args: CliApp.CmdArgs): void {
    this.ctx.log.info.h1('Processing').count(args.length).text('files').emit();
  }
}
```

### Declarative Pattern

```typescript
const RootCommand = CliApp.Cmd.create<AppContext, AppContext, RootOptions>(
  {
    options: { '--config <file>': 'Config file' },
    hydrateContext: (ctx, opts) => {
      if (opts.dryRun) ctx.dryRun = true;
    },
    subCommands: {
      process: CliApp.Cmd.create({
        name: 'process',
        arguments: ['[files...]'],
        action: (ctx, _opts, args) => {
          ctx.log.info.h1('Processing').count(args.length).text('files').emit();
        },
      }),
    },
  },
  { root: true },
);
```

---

## Service Base Class

Avoid repeating generics in service classes:

```typescript
// Define once
export abstract class Base extends CliApp.BaseClass<AppContext, AppBuilder, AppLogger> {}

// Use everywhere - no generics needed
class MyService extends Base {
  process() {
    this.info.text('Starting').emit(); // Direct log access
    this.debug.customMethod().emit(); // Custom builder methods
  }
}
```

---

## Built-in Logging Options (Root Commands)

With `{ root: true }`, these are automatically added:

| Flag                  | Effect                               |
| --------------------- | ------------------------------------ |
| `--log-level <level>` | Threshold (FATAL to SILLY)           |
| `--verbose`           | Shortcut for INFO                    |
| `-D, --debug`         | Shortcut for DEBUG                   |
| `-T, --trace`         | Shortcut for TRACE                   |
| `-S, --spam`          | Shortcut for SPAM                    |
| `--log-show [props]`  | Show metadata fields                 |
| `-A, --log-show-all`  | Show all metadata                    |
| `--no-color`          | Disable colors                       |
| `-n, --dry-run`       | Dry-run mode (if `{ dryRun: true }`) |

---

## MCP Server Support

Expose commands as MCP tools:

```typescript
if (Deno.args.includes('--mcp')) {
  const ctx = new AppContext(pkg);
  const transport = new Log.Transport.Console.Transport(ctx.logMgr, {
    color: false,
    useStderr: true,
  });
  await ctx.logMgr.addTransport(transport);
  await ctx.setupLogging({ pkg: 'mcp' });

  const server = new CliApp.Mcp.Server(ctx, {
    createCommand: (childCtx) => new App.Cmd.Root(childCtx),
  });
  await server.init();
  await server.serve(); // Runs JSON-RPC over stdio
}
```

---

## Progress Indicators

```typescript
class AppContext extends CliApp.Ctx.AbstractBase {
  protected override builderClass = CliApp.Progress.MsgBuilder;
}

// Basic usage
this.log.info.text('Processing').start({ type: 'spinner', color: 'cyan' });
await doWork();
this.log.info.text('Halfway').update();
this.log.info.icheck().text('Done!').complete();

// Nested progress - parent restored when child completes
this.log.info.text('Building').start();
this.log.info.text('  Compiling').start();
await compile();
this.log.info.text('  Done').complete(); // Shows "Building" again
this.log.info.icheck().text('Complete').complete();

// "Using" pattern - automatic cleanup
using _progress = this.log.info.text('Working').start();
await doWork(); // Automatically completes on block exit
```

---

## Key Types

```typescript
// Command options type
type RootOptions = CliApp.CmdOptions & { config?: string; dryRun?: boolean };

// Context with custom builder
class AppContext extends CliApp.Ctx.AbstractBase<AppBuilder, AppLogger> {
  protected override builderClass = AppBuilder;
}

// Service base
abstract class Base extends CliApp.BaseClass<AppContext, AppBuilder, AppLogger> {}
```

---

## Common Patterns

### Error Handling

```typescript
import { SilentError } from '@epdoc/cliapp';
if (!isValid(input)) throw new SilentError('Invalid input'); // No stack trace
```

### Fluent Options

```typescript
override defineOptions(): void {
  this.option('-f, --file <path>', 'Input file')
    .default('./input.txt')
    .env('INPUT_FILE')
    .choices(['a', 'b', 'c'])
    .emit();
}
```

---

## File Reference

| File                  | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `context.ts`          | `AbstractBase` - context base class        |
| `cmd/abstract.ts`     | `AbstractCommand` - command base class     |
| `run.ts`              | `run()` - entry point                      |
| `cmd/factory.ts`      | `createCommand()` - declarative commands   |
| `base.ts`             | `BaseClass` - service helper               |
| `mcp/server.ts`       | `McpServer` - MCP support                  |
| `progress/builder.ts` | `ProgressMsgBuilder` - progress indicators |

---

**Current version**: 2.0.x | **Entry**: `mod.ts` | **JSR**: `@epdoc/cliapp`

**Generated**: 2026-03-10
