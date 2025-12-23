# @epdoc/cliapp

A powerful CLI framework built on [@epdoc/logger](https://github.com/epdoc/logger) and [Commander.js](https://www.npmjs.com/package/commander), designed for building type-safe, maintainable command-line applications.

## Overview

`@epdoc/cliapp` provides a modern approach to CLI development with:

- **🚀 BaseContext Pattern** - Simplified context management eliminating complex generics
- **📝 Declarative API** - Clean command definitions with automatic type inference
- **🎯 Arguments Support** - Full support for command arguments (required, optional, variadic)
- **⚙️ Rich Option Types** - Built-in types (string, number, boolean, date, path, array) with extensibility
- **🔧 Custom Message Builders** - Project-specific logging methods with type safety
- **📊 Structured Logging** - Built on [@epdoc/logger](https://github.com/epdoc/logger) with rich formatting
- **🏗️ Scalable Architecture** - Patterns for single commands to complex multi-command applications

## Installation

```bash
deno add jsr:@epdoc/cliapp
```

## Quick Start

### Minimal CLI App

```typescript
import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import pkg from './deno.json' with { type: 'json' };

// 1. Define types once per project
type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

// 2. Create your context
class AppContext extends CliApp.Ctx.Base<MsgBuilder, Logger> {
  constructor() {
    super(pkg);
    this.setupLogging(); // Must call in constructor
  }

  setupLogging() {
    this.logMgr = Log.createLogManager(undefined, { threshold: 'info' });
    this.log = this.logMgr.getLogger<Logger>();
  }
}

// 3. Define your command
const app = CliApp.Declarative.defineRootCommand({
  name: 'my-tool',
  description: 'A simple CLI tool',
  arguments: [
    { name: 'files', description: 'Files to process', variadic: true }
  ],
  options: {
    output: CliApp.Declarative.option.path('--output <dir>', 'Output directory'),
    verbose: CliApp.Declarative.option.boolean('--verbose', 'Verbose output')
  },
  async action(ctx, args, opts) {
    // ctx: AppContext, args: string[], opts: ParsedOptions
    const appCtx = ctx as unknown as AppContext;
    
    appCtx.log.info.h1('Processing Files')
      .label('Files:').value(args.join(', '))
      .label('Output:').value(opts.output)
      .emit();
  }
});

// 4. Run it
if (import.meta.main) {
  await CliApp.Declarative.createApp(app, () => new AppContext());
}
```

### With Custom Message Builder

```typescript
// Define project-specific logging methods
const AppBuilder = Console.extender({
  fileOp(operation: string, path: string) {
    return this.text('📁 ').text(operation).text(' ').path(path);
  },
  
  apiCall(method: string, endpoint: string) {
    return this.text('🌐 ').text(method).text(' ').url(endpoint);
  },
  
  progress(current: number, total: number) {
    const percent = Math.round((current / total) * 100);
    return this.text(`⏳ Progress: ${current}/${total} (${percent}%)`);
  }
});

type MsgBuilder = InstanceType<typeof AppBuilder>;
type Logger = Log.Std.Logger<MsgBuilder>;

class AppContext extends CliApp.Ctx.Base<MsgBuilder, Logger> {
  // Add application state
  processedFiles = 0;
  
  constructor() {
    super(pkg);
    this.setupLogging();
  }

  setupLogging() {
    this.logMgr = Log.createLogManager(AppBuilder, { threshold: 'info' });
    this.log = this.logMgr.getLogger<Logger>();
  }
  
  // Helper methods using custom msgbuilder
  logFileOperation(op: string, path: string) {
    this.log.info.fileOp(op, path).emit();
    this.processedFiles++;
  }
}
```

## Project Organization

### Single Command Application

```
my-tool/
├── deno.json
├── src/
│   ├── main.ts          # Entry point with command definition
│   ├── context.ts       # AppContext class
│   └── types.ts         # Type definitions
└── README.md
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
```

### Multi-Command Application

```
my-cli/
├── deno.json
├── src/
│   ├── main.ts          # Root command and app runner
│   ├── context.ts       # Shared AppContext
│   ├── types.ts         # Shared types
│   ├── commands/
│   │   ├── fetch.ts     # Fetch command
│   │   ├── process.ts   # Process command
│   │   └── export.ts    # Export command
│   └── lib/
│       ├── api.ts       # Business logic
│       └── utils.ts     # Utilities
└── README.md
```

**src/commands/fetch.ts:**
```typescript
import * as CliApp from '@epdoc/cliapp';
import type { AppContext } from '../context.ts';

export const fetchCommand = CliApp.Declarative.defineCommand({
  name: 'fetch',
  description: 'Fetch data from remote source',
  arguments: [
    { name: 'endpoint', description: 'API endpoint to fetch from' }
  ],
  options: {
    limit: CliApp.Declarative.option.number('--limit <n>', 'Max items').default(100),
    format: CliApp.Declarative.option.string('--format <type>', 'Output format')
      .choices(['json', 'csv']).default('json')
  },
  async action(ctx, args, opts) {
    const appCtx = ctx as unknown as AppContext;
    const endpoint = args[0];
    
    appCtx.log.info.apiCall('GET', endpoint).emit();
    // Implementation here
  }
});
```

**src/main.ts:**
```typescript
import * as CliApp from '@epdoc/cliapp';
import { AppContext } from './context.ts';
import { fetchCommand } from './commands/fetch.ts';
import { processCommand } from './commands/process.ts';
import { exportCommand } from './commands/export.ts';

const app = CliApp.Declarative.defineRootCommand({
  name: 'my-cli',
  description: 'Multi-purpose data processing CLI',
  options: {
    config: CliApp.Declarative.option.path('--config <file>', 'Config file'),
    verbose: CliApp.Declarative.option.boolean('--verbose', 'Verbose output')
  },
  commands: {
    fetch: fetchCommand,
    process: processCommand,
    export: exportCommand
  },
  async action(ctx, args, opts) {
    const appCtx = ctx as unknown as AppContext;
    appCtx.log.info.h1('My CLI Tool').text('Use --help for commands').emit();
  }
});

if (import.meta.main) {
  await CliApp.Declarative.createApp(app, () => new AppContext());
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
│   ├── commands/
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

### Declarative API

#### Command Definition

```typescript
interface CommandDefinition {
  name: string;
  description: string;
  arguments?: ArgumentDefinition[];
  options?: Record<string, BaseOption>;
  action: (ctx: Ctx.IBase, args: string[], opts: ParsedOptions) => Promise<void>;
}

interface ArgumentDefinition {
  name: string;
  description: string;
  required?: boolean;    // Default: true for single args, false for variadic
  variadic?: boolean;    // Allows multiple values: <files...>
}
```

#### Root Command Definition

```typescript
interface RootCommandDefinition extends CommandDefinition {
  commands?: Record<string, DeclarativeCommandInterface>;
}
```

#### Built-in Option Types

```typescript
// String options
CliApp.Declarative.option.string('--name <value>', 'Description')
  .choices(['a', 'b', 'c'])
  .default('a')
  .required()

// Number options  
CliApp.Declarative.option.number('--count <n>', 'Description')
  .default(10)
  .required()

// Boolean flags
CliApp.Declarative.option.boolean('--flag', 'Description')
CliApp.Declarative.option.boolean('--no-cache', 'Disable cache').inverted()

// Date options
CliApp.Declarative.option.date('--since <date>', 'Description')
  .default(new Date())

// Path options (files/directories)
CliApp.Declarative.option.path('--output <path>', 'Description')
  .default('./output')

// Array options (comma-separated)
CliApp.Declarative.option.array('--tags <list>', 'Description')
  .default(['default'])
```

#### Custom Option Types

```typescript
export class CustomOption extends CliApp.Declarative.Option.Base<CustomType> {
  parse(value: string): CustomType {
    // Your parsing logic
    return parseCustomValue(value);
  }
  
  // Optional: Override validation
  validate(value: CustomType): boolean {
    return isValidCustomValue(value);
  }
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
- Use type assertions: `ctx as unknown as AppContext` in actions
- Add application state and helper methods to your context class

## Examples

See the [examples directory](../examples/) for complete working examples:

- **[cliapp.run.ts](../examples/cliapp.run.ts)** - Complete CLI app with BaseContext and declarative API
- **[logger.basics.run.ts](../examples/logger.basics.run.ts)** - Logger setup patterns
- **[logger.advanced.run.ts](../examples/logger.advanced.run.ts)** - Advanced logging features

## Migration from Traditional API

The traditional imperative API remains fully supported. You can migrate incrementally:

### 1. Keep Existing Commands
```typescript
// Existing traditional API code continues to work
const cmd = new CliApp.Command(pkg);
cmd.init(ctx);
cmd.option('--input <file>', 'Input file');
cmd.action(async (opts) => { /* ... */ });
```

### 2. Add New Commands with Declarative API
```typescript
// New commands can use declarative API
const newCmd = CliApp.Declarative.defineCommand({
  name: 'new-feature',
  options: { input: CliApp.Declarative.option.path('--input <file>') },
  action: async (ctx, args, opts) => { /* ... */ }
});
```

### 3. Adopt BaseContext Pattern
```typescript
// Replace complex factory patterns with BaseContext
class AppContext extends CliApp.Ctx.Base<MsgBuilder, Logger> {
  constructor() { super(pkg); this.setupLogging(); }
  setupLogging() { /* simple setup */ }
}
```

## Best Practices

### 1. Project Structure
- **Single command**: Keep simple with main.ts and context.ts
- **Multi-command**: Organize commands in separate files/directories
- **Complex apps**: Use nested command structure with shared types

### 2. Type Safety
- Define types once per project (`MsgBuilder`, `Logger`)
- Use separate declaration pattern for options
- Leverage TypeScript's type inference in actions

### 3. Custom Message Builders
- Add domain-specific logging methods (`fileOp`, `apiCall`, `progress`)
- Keep methods focused and reusable
- Use semantic naming that matches your domain

### 4. Error Handling
```typescript
async action(ctx, args, opts) {
  const appCtx = ctx as unknown as AppContext;
  
  try {
    // Your logic here
    appCtx.log.info.text('Success!').emit();
  } catch (error) {
    appCtx.log.error.text(`Failed: ${error.message}`).emit();
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
await command.definition.action(testCtx, ['arg1'], { option1: 'value' });
```

## Advanced Features

### Custom Validation
```typescript
const options = {
  port: CliApp.Declarative.option.number('--port <n>', 'Port number')
    .default(3000)
    .validate((value) => value > 0 && value < 65536)
};
```

### Environment Variable Integration
```typescript
const options = {
  apiKey: CliApp.Declarative.option.string('--api-key <key>', 'API key')
    .default(Deno.env.get('API_KEY') || '')
    .required()
};
```

### Configuration File Support
```typescript
async action(ctx, args, opts) {
  const appCtx = ctx as unknown as AppContext;
  
  if (opts.config) {
    const config = JSON.parse(await Deno.readTextFile(opts.config));
    // Merge config with options
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.
