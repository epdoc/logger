# @epdoc/demo - CliApp Tutorial

A complete tutorial demonstrating how to build CLI applications using `@epdoc/cliapp`.

## Overview

This demo shows:
- Creating a root command with global options
- Adding subcommands with their own options and arguments
- Custom message builders for structured logging
- Context inheritance for command-specific state
- Integration with `@epdoc/logger` for rich logging

## Running the Demo

```bash
# Show help
deno run -A main.ts --help

# Run root command (no subcommand)
deno run -A main.ts

# Run with logging options
deno run -A main.ts -SA --log-show pkg

# List files
deno run -A main.ts list --humanize file1.txt file2.txt

# Query command with custom context
deno run -A main.ts query --more mastodon.social fosstodon.org

# Sub command
deno run -A main.ts sub --force myinput
```

## Project Structure

```
packages/demo/
├── main.ts              # Entry point
├── deno.json            # Package configuration
└── src/
    ├── mod.ts           # Module exports
    ├── context.ts       # Context and message builder definitions
    ├── app/             # Application logic
    └── cmds/            # Command definitions
        ├── root.ts      # Root command
        ├── list.ts      # List subcommand
        ├── process.ts   # Query subcommand (with custom context)
        └── sub.ts       # Simple subcommand
```

## Step-by-Step Guide

### 1. Create the Entry Point (`main.ts`)

```typescript
import * as CliApp from '@epdoc/cliapp';
import pkg from './deno.json' with { type: 'json' };
import * as App from './src/mod.ts';

if (import.meta.main) {
  // 1. Create root context with package info
  const ctx = new App.Ctx.RootContext(pkg);
  
  // 2. Setup logging with initial pkg name
  await ctx.setupLogging({ pkg: 'app' });

  // 3. Create and initialize root command
  const rootCmd = new App.Cmd.Root(ctx);
  await rootCmd.init();

  // 4. Run the CLI
  CliApp.run(ctx, rootCmd);
}
```

### 2. Define Custom Message Builder (`src/context.ts`)

Extend the base message builder to add application-specific formatting:

```typescript
import * as CliApp from '@epdoc/cliapp';
import * as FS from '@epdoc/fs/fs';

export class CustomMsgBuilder extends CliApp.Ctx.MsgBuilder {
  // Add custom formatting methods
  fileOp(item: FS.Typed, size: number = 0, units = 'byte') {
    if (item instanceof FS.Folder) {
      return this.label('Folder:').relative(item.path);
    } else if (item instanceof FS.File) {
      return this.label('File:').relative(item.path).count(Math.round(size)).text(units);
    }
    return this;
  }

  opts(opts: Dict, name?: string): this {
    return this.label(name ? name + ':' : 'Options:').value(JSON.stringify(opts));
  }
}
```

### 3. Create Root Context (`src/context.ts`)

```typescript
export class RootContext extends CliApp.Ctx.AbstractBase<CustomMsgBuilder, CustomLogger> {
  app!: App.Main;
  name?: string;
  happyMode = false;

  // Tell the base class to use your custom builder
  protected override builderClass = CustomMsgBuilder;

  constructor(
    pkg: CliApp.DenoPkg | RootContext,
    params: Log.IGetChildParams = {},
  ) {
    super(pkg, params);
    if (pkg instanceof RootContext) {
      this.copyProperties(pkg);
    }
    if (!this.app) {
      this.app = new App.Main(this);
    }
  }
}
```

### 4. Create Root Command (`src/cmds/root.ts`)

```typescript
import * as CliApp from '@epdoc/cliapp';
import * as Ctx from '../context.ts';

type RootCmdOpts = CliApp.CmdOptions & { 
  happyMode?: boolean; 
  name?: string;
};

export class RootCommand extends Ctx.BaseRootCmdClass<RootCmdOpts> {
  constructor(ctx: Ctx.RootContext) {
    super(ctx, { root: true, dryRun: true });
  }

  override defineOptions(): void {
    this.option('--happy-mode', 'Enable special happy mode').emit();
    this.option('--name <name>', 'Name to use for greeting').emit();
    this.addHelpText('\nThis is help text for the root command.');
  }

  override hydrateContext(opts: RootCmdOpts, _args: CliApp.CmdArgs): void {
    this.ctx.name = opts.name;
    this.ctx.happyMode = opts.happyMode ?? false;
  }

  override execute(_opts: RootCmdOpts, _args: CliApp.CmdArgs): void {
    this.log.info.text('Root command executed').emit();
  }

  protected override getSubCommands() {
    return [
      new ListCommand(this.parentContext),
      new QueryCommand(this.parentContext),
    ];
  }
}
```

### 5. Create Simple Subcommand (`src/cmds/list.ts`)

```typescript
type ListCmdOpts = {
  humanize: boolean;
};

export class ListCommand extends Ctx.BaseRootCmdClass<ListCmdOpts> {
  override defineMetadata() {
    this.description = 'List files';
    this.name = 'list';
  }

  override defineOptions() {
    this.option('-h --humanize', 'Human size output').emit();
    this.argument('[files...]', 'Files to list sizes of').emit();
  }

  override async execute(opts: ListCmdOpts, args: string[]): Promise<void> {
    const options = { humanize: opts.humanize, files: args };
    await this.ctx.app.listFiles(options);
  }
}
```

### 6. Create Subcommand with Custom Context (`src/cmds/process.ts`)

For commands that need additional state, create a child context:

```typescript
// Define child context in src/context.ts
export class QueryContext extends RootContext {
  more = false;
  apis: App.Api[] = [];

  constructor(parent: RootContext, params: Log.IGetChildParams = { pkg: 'query' }) {
    super(parent, params);
  }
}

// Define base class for commands using QueryContext
export abstract class BaseQueryCmdClass 
  extends CliApp.Cmd.AbstractBase<QueryContext, RootContext, QueryCmdOpts> {}

// Create the command
export class QueryCommand extends Ctx.BaseQueryCmdClass {
  override defineMetadata() {
    this.description = 'Query Mastodon instances';
    this.name = 'query';
  }

  override createContext(parent: Ctx.RootContext): Ctx.QueryContext {
    return new Ctx.QueryContext(parent, { pkg: 'query' });
  }

  override hydrateContext(opts: Ctx.QueryCmdOpts, args: CliApp.CmdArgs): void {
    this.ctx.more = opts.more ?? false;
    this.ctx.apis = args.map((server) => new App.Api(server));
  }

  override defineOptions(): void {
    this.option('--more', 'Show more info').emit();
    this.argument('<servers...>', 'Servers to query').emit();
  }

  override async execute(_opts: Ctx.QueryCmdOpts, _args: string[]): Promise<void> {
    for (const api of this.ctx.apis) {
      const meta = await api.getMeta();
      this.log.info.opts(meta, 'API Metadata').emit();
    }
  }
}
```

## Key Concepts

### Command Lifecycle

1. **constructor**: Initialize command with context
2. **defineMetadata()**: Set name, description, aliases
3. **defineOptions()**: Define CLI options and arguments
4. **createContext()**: Create or reuse context (runs during preAction hook)
5. **hydrateContext()**: Apply parsed options to context (runs during preAction hook)
6. **execute()**: Run command logic

### Context Flow

- **Root context**: Created in `main.ts`, passed to root command
- **Reuse context**: Most subcommands reuse parent context (default behavior)
- **Child context**: Commands needing isolated state create child contexts via `createContext()`

### Base Classes

Create base command classes to reduce boilerplate:

```typescript
// For commands using RootContext
export abstract class BaseRootCmdClass<TOpts extends CliApp.CmdOptions>
  extends CliApp.Cmd.AbstractBase<RootContext, RootContext, TOpts> {}

// For commands using QueryContext
export abstract class BaseQueryCmdClass 
  extends CliApp.Cmd.AbstractBase<QueryContext, RootContext, QueryCmdOpts> {}
```

### Logging Options

The root command automatically includes these options:
- `--log-level <level>`: Set log threshold (FATAL, ERROR, WARN, INFO, DEBUG, etc.)
- `-D, --debug`: Shortcut for debug level
- `-T, --trace`: Shortcut for trace level
- `-S, --spam`: Shortcut for spam level
- `--log-show [props]`: Show log properties (pkg, level, time, reqId, sid)
- `-A, --log-show-all`: Show all log properties
- `-n, --dry-run`: Enable dry-run mode (if `dryRun: true` in constructor)

### Custom Message Builder Methods

Use custom methods for consistent formatting:

```typescript
// Instead of:
this.log.info.text('File:').text(path).text(size).emit();

// Use custom method:
this.log.info.fileOp(file, size, 'KB').emit();
```

## Best Practices

1. **Keep commands focused**: Each command should do one thing well
2. **Leverage custom builders**: Add formatting methods for common patterns
3. **Type your options**: Define option types for type safety
4. **Use base classes**: Reduce boilerplate with typed base command classes

## Next Steps

- Review the full source code in `packages/demo/src/`
- Check `@epdoc/cliapp` documentation for advanced features
- Explore `@epdoc/logger` for logging capabilities
- See `@epdoc/msgbuilder` for message formatting options
