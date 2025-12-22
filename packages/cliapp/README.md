# cliapp

A CLI helper application using [@epdoc/logger](https://github.com/epdoc/logger) and [commanderjs](https://www.npmjs.com/package/commander).

## Overview

`cliapp` captures common code needed across multiple command line applications that use [@epdoc/logger](https://github.com/epdoc/logger). Key features include:

- **Declarative Command API:** New simplified API for defining commands with automatic type inference and minimal boilerplate.
- **Extensible Option System:** Built-in option types (string, number, boolean, date, path, array) with support for custom option types through subclassing.
- **Inverted Boolean Flags:** Support for `--no-` style flags that invert boolean values.
- **Command Parsing:** Extends the [commanderjs](https://www.npmjs.com/package/commander) Command object.
  - `CliApp.Command` in [command.ts](./src/command.ts) adds standard [@epdoc/logger](https://github.com/epdoc/logger)
    logging options to the Command object.
  - The `Commander` object from `commanderjs` is exported as well, allowing you to create custom options (e.g.,
    `new CliApp.Commander.Option(...)`) without reimporting Commanderjs.
  - Continue to use the `CliApp.Command` object as you did the `Command` object from Commanderjs.
  - Apply cli logging options to [@epdoc/logger](https://github.com/epdoc/logger) using
    [configureLogging](./src/util.ts).
- **Logging:** Built on top of [@epdoc/logger](https://github.com/epdoc/logger).
- **Context Management:** The application context is managed in [context.ts](./src/context.ts).
  - Adapt and extend this object for your own application.

## Install

```
deno add jsr:@epdoc/cliapp
```

## Quick Start (Declarative API)

The declarative API eliminates most boilerplate and provides full type safety:

### Single Command App

```typescript
import * as CliApp from '@epdoc/cliapp';
import { MyContext } from './context.ts';

const app = CliApp.defineRootCommand({
  name: 'my-tool',
  description: 'A simple CLI tool',
  options: {
    input: CliApp.option.path('--input <file>', 'Input file').required(),
    format: CliApp.option.string('--format <type>', 'Output format').choices(['json', 'csv']).default('json')
  },
  async action(opts, ctx) {
    // opts is fully typed: { input: string, format: 'json' | 'csv' }
    ctx.log.info.text(`Processing ${opts.input} as ${opts.format}`).emit();
    // Your business logic here
  }
});

await CliApp.createApp(app, () => new MyContext());
```

### Multi-Command App

```typescript
import * as CliApp from '@epdoc/cliapp';
import { MyContext } from './context.ts';

const fetchCmd = CliApp.defineCommand({
  name: 'fetch',
  description: 'Fetch data from source',
  options: {
    since: CliApp.option.date('--since <date>', 'Fetch since date'),
    limit: CliApp.option.number('--limit <n>', 'Max items').default(100)
  },
  async action(opts, ctx) {
    // opts is fully typed: { since: Date, limit: number }
    await ctx.app.fetch(opts);
  }
});

const exportCmd = CliApp.defineCommand({
  name: 'export',
  description: 'Export processed data',
  options: {
    output: CliApp.option.path('--output <dir>', 'Output directory').default('./output')
  },
  async action(opts, ctx) {
    await ctx.app.export(opts);
  }
});

const app = CliApp.defineRootCommand({
  name: 'data-tool',
  description: 'Process and export data',
  globalOptions: {
    profile: CliApp.option.string('--profile <name>', 'Profile to use').default('default')
  },
  subcommands: [fetchCmd, exportCmd]
});

await CliApp.createApp(app, () => new MyContext());
```

### Available Option Types

```typescript
CliApp.option.string('--name <value>', 'String option')
CliApp.option.number('--count <n>', 'Number option')  
CliApp.option.boolean('--flag', 'Boolean flag')
CliApp.option.date('--since <date>', 'Date option')
CliApp.option.path('--output <path>', 'File/directory path')
CliApp.option.array('--items <list>', 'Comma-separated array')

// Boolean options support inversion for --no- style flags:
CliApp.option.boolean('--no-online', 'Disable online mode').inverted()

// All options support chaining:
CliApp.option.string('--format <type>', 'Format')
  .choices(['json', 'csv', 'xml'])
  .default('json')
  .required()
```

### Custom Option Types

You can create custom option types by extending `BaseOption`:

```typescript
import { Declarative } from '@epdoc/cliapp';
import { dateRanges, type DateRanges } from '@epdoc/daterange';

export class DateRangeOption extends Declarative.Option.Base<DateRanges> {
  parse(value: string): DateRanges {
    return dateRanges(value);
  }
}

// Usage:
const options = {
  period: new DateRangeOption('-p, --period <range>', 'Date range to process')
    .default(dateRanges('last-week'))
    .required()
};

// Supports formats like:
// --period 2025           (entire year)
// --period 202501         (entire month) 
// --period 20250101       (entire day)
// --period 20250101-20250107  (date range)
// --period 2025,202601-202603 (multiple ranges)
```


## Traditional API (Still Supported)

The original imperative API remains fully supported for existing projects:

### Basics

1. Import `CliApp` and `Commander` from the module.
2. Create your command object: `cmd = new CliApp.Command()`.
3. Initialize it with `cmd.init(ctx)` to apply output styling and `deno.json` values (`version`, `description`, `name`).
4. Add your own options using `cmd.option(...)` or by creating a `new Commander.Option(...)` and adding it with
   `cmd.addOption(...)`.
5. Use `cmd.addLogging(ctx)` to add standard logging CLI options.
6. Call `cmd.parseOpts()` to parse command line arguments.
7. Apply logging CLI options to `@epdoc/logger` using `CliApp.util.configureLogging(ctx, opts)`.
8. Optionally use the `CliApp.util.run` wrapper to log your application's termination consistently.

## Examples

The `packages/examples/` directory contains educational examples:

### Complete Example (Recommended Starting Point)
**[complete-example.ts](../examples/complete-example.ts)** - The definitive example showing:
- ✨ **Custom MsgBuilder** with project-specific logging methods (`apiCall`, `fileOp`, `progress`)
- 🏗️ **Extended Context** with application state and helper methods  
- 📋 **Multi-command app** using declarative API with global options
- 🎯 **Real-world patterns** like progress indicators, file operations, API calls
- 🔧 **All option types** including inverted booleans and validation

```bash
# Try the complete example
deno run -A examples/complete-example.ts fetch --endpoint /users --limit 50
deno run -A examples/complete-example.ts process --input data.json --validate
```

### Other Examples
- **[declarative.ts](../examples/declarative.ts)** - Simple declarative API patterns
- **[traditional-api.ts](../examples/traditional-api.ts)** - Original imperative API for legacy projects  
- **[logger-helper.ts](../examples/logger-helper.ts)** - Using the `createLogManager` helper

### Migration Guide
Projects using the traditional API can migrate incrementally:
1. **Keep existing setup** - Traditional API remains fully supported
2. **Try declarative commands** - Add new commands using the declarative API
3. **Extend msgbuilder** - Add custom logging methods with `Console.extender`
4. **Use createLogManager** - Simplify logger setup (optional)

```ts
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder'
import pkg from '../deno.json' with { type: 'json' };
// Import both CliApp and the Commander object
import * as CliApp from '@epdoc/cliapp';

// deno run -A examples/basic.ts -t

type M = Console.Builder;
type L = Log.Std.Logger<M>;

const logMgr: Log.Mgr<M> = new Log.Mgr<M>().init();
logMgr.threshold = 'info';

// The basic context, which you can extend as needed for your own app
const ctx: CliApp.ICtx<M, L> = {
  log: logMgr.getLogger<L>(),
  logMgr: logMgr,
  pkg: pkg,
  dryRun: false,
  close: (): Promise<void> => {
    return Promise.resolve();
  },
};

// We're adding a purge option, for demonstration purposes
type CliOpts = CliApp.Opts & { purge?: boolean };

class Cli {
  run(ctx: CliApp.ICtx<M, L>): Promise<void> {
    const command = new CliApp.Command(pkg);
    command.init(ctx);

    // Add a custom option using the exported Commander.Option
    const purgeOption = new CliApp.Commander.Option('-p --purge', 'Purge old data').default(false);
    command.addOption(purgeOption);

    command.addLogging(ctx);
    const opts = command.parseOpts() as CliOpts;

    CliApp.util.configureLogging(ctx, opts);
    ctx.log.info.h1('Running').label('Purge mode:').value(opts.purge).emit();
    return Promise.resolve();
  }
}

const app = new Cli();

// Our utility run method
await CliApp.util.run(ctx, () => app.run(ctx));
```

## Development

1. Install [Deno](https://deno.land/).
2. Clone the repository:

   ```sh
   git clone <@epdoc/cliapp>
   cd cliapp
   ```

Customize the template as needed for your project requirements.

## Contributing

For contributing or modifying the project:

1. Fork the repository.
2. Create a new branch for your changes.
3. Submit your changes via a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please open an issue in the repository.
