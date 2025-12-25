# @epdoc/cliapp

> **📚 Complete Documentation**: This package is part of the [@epdoc/logger ecosystem](../../README.md). For comprehensive guides, tutorials, and integration examples, see the [root documentation](../../README.md).

A CLI framework built on [@epdoc/logger](https://github.com/epdoc/logger) and [Commander.js](https://www.npmjs.com/package/commander), designed for building type-safe, maintainable command-line applications.

## Quick Links to Complete Documentation

- **[🚀 Getting Started Guide](../../GETTING_STARTED.md)** - Complete ecosystem tutorial including CLI integration
- **[🎯 Demo Project](../../packages/demo/)** - Complete working CLI app with custom message builders
- **[💡 Examples Collection](../../packages/examples/)** - Focused CLI and logging examples
- **[🏗️ Architecture Overview](../../ARCHITECTURE.md)** - Technical patterns and ContextBundle usage
- **[⚙️ Configuration Guide](../../CONFIGURATION.md)** - Advanced logging configuration for CLI apps
- **[📝 Core Logger](../../packages/logger/README.md)** - Logging functionality
- **[🎨 Message Builders](../../packages/msgbuilder/README.md)** - Rich formatting for CLI output

## Package-Specific Features

This package provides CLI application framework with:

- **🚀 BaseContext Pattern** - Simplified context setup with structured logging integration
- **🏗️ Structured Commands** - Class-based command architecture with `Cmd.Sub` and `Cmd.Root`
- **🎯 Arguments Support** - Full support for command arguments (required, optional, variadic)
- **⚙️ Rich Options** - Built-in Commander.js option handling with type safety
- **🔧 Custom Message Builders** - Project-specific logging methods with type safety
- **📊 Structured Logging** - Built on [@epdoc/logger](https://github.com/epdoc/logger) with rich formatting
- **🏗️ Scalable Architecture** - Patterns for single commands to complex multi-command applications

## Installation

```bash
deno add jsr:@epdoc/cliapp
```

> **💡 Ecosystem Integration**: This package is designed to work with [@epdoc/logger](../logger/) and [@epdoc/msgbuilder](../msgbuilder/) for complete CLI application development. See the [complete ecosystem guide](../../GETTING_STARTED.md) for integrated usage patterns.

## Quick Start

### [Minimal CLI App](../examples/minimal.run.ts)

```typescript
import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import pkg from './deno.json' with { type: 'json' };

// 1. Define types once per project
type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

// 2. Bundle context types together
type AppBundle = CliApp.Cmd.ContextBundle<AppContext, MsgBuilder, Logger>;

// 3. Define options interface
interface AppOptions {
  verbose?: boolean;
  output?: string;
}

// 4. Create your context
class AppContext extends CliApp.Ctx.Base<MsgBuilder, Logger> {
  constructor() {
    super(pkg);
    this.setupLogging(); // Must call in constructor
  }

  setupLogging() {
    // For standard Console.Builder, you can use either:
    this.logMgr = Log.createLogManager(Console.Builder, { threshold: 'info' });
    // or: this.logMgr = Log.createLogManager(undefined, { threshold: 'info' });
    this.log = this.logMgr.getLogger<Logger>();
  }
}

// 5. Define your root command
class AppRootCmd extends CliApp.Cmd.Root<AppBundle, AppOptions> {
  constructor(ctx: AppContext) {
    super(ctx, ctx.pkg);
  }

  protected override addArguments(): void {
    this.cmd.argument('[files...]', 'Files to process');
  }

  protected override addOptions(): void {
    this.cmd
      .option('--output <dir>', 'Output directory')
      .option('--verbose', 'Verbose output');
  }

  protected override executeAction(args: string[], opts: AppOptions): Promise<void> {
    this.ctx.log.info.h1('Processing Files')
      .label('Files:').value(args.join(', '))
      .label('Output:').value(opts.output || 'default')
      .emit();
    return Promise.resolve();
  }
}

// 6. Run it
if (import.meta.main) {
  const ctx = new AppContext();
  const rootCmd = new AppRootCmd(ctx);
  const cmd = await rootCmd.init();
  await cmd.parseAsync();
}
```

### With Custom Message Builder

For a complete example of using custom message builders with real-world CLI functionality, see the **[Demo Project](../demo/README.md)**.

The demo showcases:
- Custom message builder with `fileOp()` methods
- File system operations with rich logging
- Multiple subcommands (`list`, `process`)
- Integration with `@epdoc/fs` for file handling
- Proper ContextBundle usage patterns

## Project Organization

### Single Command Application

```
my-tool/
├── deno.json
├── main.ts             # Entry point with root command
├── src/
│   ├── context.ts      # AppContext class
│   └── types.ts        # Type definitions
└── README.md
```

**main.ts:**
```typescript
import * as CliApp from '@epdoc/cliapp';
import { AppContext, AppBundle } from './src/context.ts';

interface MyOptions {
  output?: string;
  verbose?: boolean;
}

class MyToolCmd extends CliApp.Cmd.Root<AppBundle, MyOptions> {
  constructor(ctx: AppContext) {
    super(ctx, ctx.pkg);
  }

  protected override addArguments(): void {
    this.cmd.argument('[files...]', 'Files to process');
  }

  protected override addOptions(): void {
    this.cmd
      .option('--output <dir>', 'Output directory')
      .option('--verbose', 'Verbose output');
  }

  protected override async executeAction(args: string[], opts: MyOptions): Promise<void> {
    // Your implementation here
  }
}

if (import.meta.main) {
  const ctx = new AppContext();
  const rootCmd = new MyToolCmd(ctx);
  const cmd = await rootCmd.init();
  await cmd.parseAsync();
}
```

**src/context.ts:**
```typescript
import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import pkg from '../deno.json' with { type: 'json' };

const AppBuilder = Console.extender({
  // Your custom logging methods
});

export type MsgBuilder = InstanceType<typeof AppBuilder>;
export type Logger = Log.Std.Logger<MsgBuilder>;

export class AppContext extends CliApp.Ctx.Base<MsgBuilder, Logger> {
  constructor() {
    super(pkg);
    this.setupLogging();
  }

  setupLogging() {
    this.logMgr = Log.createLogManager(AppBuilder, { threshold: 'info' });
    this.log = this.logMgr.getLogger<Logger>();
  }
}

// Export the bundled type for use in commands
export type AppBundle = CliApp.Cmd.ContextBundle<AppContext, MsgBuilder, Logger>;
```

### Multi-Command Application

```
my-cli/
├── deno.json
├── main.ts             # Minimal run wrapper
├── src/
│   ├── context.ts      # Shared AppContext
│   ├── types.ts        # Shared types
│   ├── cmd/
│   │   ├── root.ts    # Fetch command
│   │   ├── fetch.ts    # Fetch command
│   │   ├── process.ts  # Process command
│   │   └── export.ts   # Export command
│   └── lib/
│       ├── api.ts      # Business logic
│       └── utils.ts    # Utilities
└── README.md
```

**src/commands/fetch.ts:**
```typescript
import * as CliApp from '@epdoc/cliapp';
import type { AppContext, AppBundle } from '../context.ts';

interface FetchOptions {
  limit?: number;
  format?: string;
}

export class FetchCmd extends CliApp.Cmd.Sub<AppBundle, FetchOptions> {
  constructor(ctx: AppContext) {
    super(ctx, 'fetch', 'Fetch data from remote source');
  }

  protected override addArguments(): void {
    this.cmd.argument('<endpoint>', 'API endpoint to fetch from');
  }

  protected override addOptions(): void {
    this.cmd
      .option('--limit <n>', 'Max items', '100')
      .option('--format <type>', 'Output format', 'json')
      .addOption(new CliApp.Commander.Option('--format <type>', 'Output format')
        .choices(['json', 'csv']).default('json'));
  }

  protected override async executeAction(args: string[], opts: FetchOptions): Promise<void> {
    const endpoint = args[0];
    this.ctx.log.info.text(`Fetching from ${endpoint}`).emit();
    // Implementation here
  }
}
```

**main.ts:**
```typescript
import * as CliApp from '@epdoc/cliapp';
import { AppContext, AppBundle } from './src/context.ts';
import { FetchCmd } from './src/commands/fetch.ts';
import { ProcessCmd } from './src/commands/process.ts';
import { ExportCmd } from './src/commands/export.ts';

interface RootOptions {
  config?: string;
  verbose?: boolean;
}

class MyCliRoot extends CliApp.Cmd.Root<AppBundle, RootOptions> {
  constructor(ctx: AppContext) {
    super(ctx, ctx.pkg);
  }

  protected override addOptions(): void {
    this.cmd
      .option('--config <file>', 'Config file')
      .option('--verbose', 'Verbose output');
  }

  protected override async addCommands(): Promise<void> {
    const fetchCmd = new FetchCmd(this.ctx);
    const processCmd = new ProcessCmd(this.ctx);
    const exportCmd = new ExportCmd(this.ctx);

    this.cmd.addCommand(await fetchCmd.init());
    this.cmd.addCommand(await processCmd.init());
    this.cmd.addCommand(await exportCmd.init());
  }

  protected override async executeAction(args: string[], opts: RootOptions): Promise<void> {
    this.ctx.log.info.h1('My CLI Tool').text('Use --help for commands').emit();
  }
}

if (import.meta.main) {
  const ctx = new AppContext();
  const rootCmd = new MyCliRoot(ctx);
  const cmd = await rootCmd.init();
  await cmd.parseAsync();
}
```

### Complex Application with Custom Options

```
enterprise-cli/
├── deno.json
├── src/
│   ├── main.ts
│   ├── context.ts
│   ├── types.ts
│   ├── cmd/
│   │   ├── deploy/
│   │   │   ├── mod.ts        # Deploy root command
│   │   │   ├── staging.ts    # Deploy to staging
│   │   │   └── production.ts # Deploy to production
│   │   └── config/
│   │       ├── mod.ts        # Config root command
│   │       ├── get.ts        # Get config
│   │       └── set.ts        # Set config
│   ├── options/
│   │   ├── environment.ts    # Custom environment option
│   │   └── daterange.ts      # Custom date range option
│   └── lib/
│       ├── deployment.ts
│       └── config.ts
└── README.md
```

**src/options/environment.ts:**
```typescript
import * as CliApp from '@epdoc/cliapp';

type Environment = 'dev' | 'staging' | 'prod';

export class EnvironmentOption extends CliApp.Declarative.Option.Base<Environment> {
  constructor(flags: string, description: string) {
    super(flags, description);
    this.choices(['dev', 'staging', 'prod']);
  }

  parse(value: string): Environment {
    if (!['dev', 'staging', 'prod'].includes(value)) {
      throw new Error(`Invalid environment: ${value}`);
    }
    return value as Environment;
  }
}
```

## API Reference

### Structured Command API

#### Base Command Classes

```typescript
// For subcommands
abstract class BaseCmd<Bundle extends ContextBundle<unknown, unknown, unknown>, TOptions = unknown> {
  constructor(ctx: Bundle['Context'], name: string, description: string, aliases?: string[]);
  
  // Override these methods as needed
  protected addArguments(): void;
  protected addOptions(): void;
  protected addExtras(): void;
  protected abstract executeAction(args: string[], opts: TOptions, cmd: Command): Promise<void>;
  
  // Call this to initialize the command
  init(): Promise<Command>;
}

// For root commands
class BaseRootCmd<Bundle extends ContextBundle<unknown, unknown, unknown>, TOptions = unknown> {
  constructor(ctx: Bundle['Context'], pkg: DenoPkg);
  
  // Override these methods as needed
  protected addArguments(): void;
  protected addOptions(): void;
  protected async addCommands(): Promise<void>;
  protected addExtras(): void;
  protected executeAction?(args: string[], opts: TOptions, cmd: Command): Promise<void>;
  
  // Call this to initialize the command
  async init(): Promise<Command>;
}

// ContextBundle type for bundling context, message builder, and logger types
type ContextBundle<Context, MsgBuilder, Logger> = {
  Context: Context;
  MsgBuilder: MsgBuilder;
  Logger: Logger;
};
```

#### Command Setup Order

Commands follow a structured setup sequence:

1. **addArguments()** - Define command arguments using `this.cmd.argument()`
2. **addOptions()** - Define command options using `this.cmd.option()`
3. **addCommands()** - *(Root commands only)* Add subcommands
4. **addExtras()** - Add help text, hooks, etc.
5. **setupAction()** - *(Internal)* Wire up the executeAction method

#### Option Definition

Use Commander.js syntax for options:

```typescript
protected override addOptions(): void {
  this.cmd
    .option('-v, --verbose', 'Verbose output')
    .option('--output <path>', 'Output file path', 'default.txt')
    .option('--count <n>', 'Number of items', '10')
    .addOption(new CliApp.Commander.Option('--format <type>', 'Output format')
      .choices(['json', 'yaml', 'csv'])
      .default('json'));
}
```

#### Argument Definition

Use Commander.js syntax for arguments:

```typescript
protected override addArguments(): void {
  this.cmd
    .argument('<input>', 'Input file')           // Required
    .argument('[output]', 'Output file')         // Optional
    .argument('[files...]', 'Multiple files');   // Variadic
}
```

### BaseContext Pattern

```typescript
abstract class BaseContext<M, L> implements Ctx.IBase<M, L> {
  log!: L;
  logMgr!: Log.Mgr<M>;
  dryRun: boolean;
  pkg: DenoPkg;
  
  constructor(pkg?: DenoPkg);
  abstract setupLogging(): void;  // Must call in constructor
  async close(): Promise<void>;
}
```

**Key Points:**
- Extend `BaseContext` with your message builder and logger types
- Call `setupLogging()` in your constructor
- Bundle types with `ContextBundle<Context, MsgBuilder, Logger>` for cleaner command signatures
- Add application state and helper methods to your context class

## Examples

See the [examples directory](../examples/) for complete working examples:

- **[cliapp.run.ts](../examples/cliapp.run.ts)** - Complete CLI app with BaseContext and structured commands
- **[logger.basics.run.ts](../examples/logger.basics.run.ts)** - Logger setup patterns
- **[logger.advanced.run.ts](../examples/logger.advanced.run.ts)** - Advanced logging features

Run all examples with: `./examples/run.sh`

## Best Practices

### 1. Project Structure
- **Single command**: Keep simple with main.ts and context.ts
- **Multi-command**: Organize commands in separate files/directories
- **Complex apps**: Use nested command structure with shared types

### 2. Type Safety
- Define types once per project (`MsgBuilder`, `Logger`)
- Bundle types together with `ContextBundle<Context, MsgBuilder, Logger>`
- Use separate declaration pattern for options
- Leverage TypeScript's type inference in actions

### 3. Custom Message Builders
- Add domain-specific logging methods (`fileOp`, `apiCall`, `progress`)
- Keep methods focused and reusable
- Use semantic naming that matches your domain

### 4. Error Handling
```typescript
protected override async executeAction(args: string[], opts: MyOptions): Promise<void> {
  try {
    // Your logic here
    this.ctx.log.info.text('Success!').emit();
  } catch (error) {
    this.ctx.log.error.text(`Failed: ${error.message}`).emit();
    Deno.exit(1);
  }
}
```

### 5. Testing
```typescript
// Create test context
const testCtx = new AppContext();
testCtx.logMgr.threshold = 'error'; // Suppress logs in tests

// Test command actions directly
const cmd = new MyCmd(testCtx);
await cmd['executeAction'](['arg1'], { option1: 'value' }, mockCommand);

// Or create a test bundle type
type TestBundle = CliApp.Cmd.ContextBundle<AppContext, MsgBuilder, Logger>;
class TestCmd extends CliApp.Cmd.Sub<TestBundle, TestOptions> {
  // Test implementation
}
```

## Advanced Features

### Async Command Initialization

Commands can perform async operations during initialization:

```typescript
class DataCmd extends CliApp.Cmd.Sub<AppBundle, DataOptions> {
  private config!: Config;

  constructor(ctx: AppContext) {
    super(ctx, 'data', 'Process data files');
  }

  override async init(): Promise<CliApp.Command> {
    // Load config before setting up options
    this.config = await this.loadConfig();
    return super.init();
  }

  protected override addOptions(): void {
    this.cmd
      .option('--format <type>', 'Data format', this.config.defaultFormat)
      .option('--output <path>', 'Output path', this.config.outputDir);
  }

  private async loadConfig(): Promise<Config> {
    // Load configuration from file, API, etc.
    return JSON.parse(await Deno.readTextFile('./config.json'));
  }
}
```

### Global Options Access

Commands can access both local and global options:

```typescript
protected override async executeAction(args: string[], opts: MyOptions, cmd: CliApp.Command): Promise<void> {
  // Local options
  console.log('Local verbose:', opts.verbose);
  
  // Global options (from parent commands)
  const globalOpts = cmd.optsWithGlobals();
  console.log('Global config:', globalOpts.config);
  
  // Command metadata
  console.log('Command name:', cmd.name());
  console.log('Raw args:', cmd.args);
}
```

### Custom Help and Hooks

```typescript
protected override addExtras(): void {
  // Add custom help text
  this.cmd.addHelpText('before', 'Custom header text');
  this.cmd.addHelpText('after', '\nExamples:\n  my-cmd process file.txt --verbose');
  
  // Add lifecycle hooks
  this.cmd.hook('preAction', (thisCommand, actionCommand) => {
    this.ctx.log.debug.text(`About to run: ${actionCommand.name()}`).emit();
  });
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.
