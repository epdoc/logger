# cliapp

A CLI application helper for [@epdoc/logger](https://github.com/epdoc/logger).

## Overview

`cliapp` provides command line support for [@epdoc/logger](https://github.com/epdoc/logger). Key features include:

- **Command Parsing:** Extends the [commanderjs](https://www.npmjs.com/package/commander) Command object.
  - `CliApp.Command` in [command.ts](./src/command.ts) adds standard [@epdoc/logger](https://github.com/epdoc/logger)
    logging options to the Command object.
  - The `Commander` object from `commanderjs` is exported as well, allowing you to create custom options (e.g.,
    `new CliApp.Commander.Option(...)`).
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

## Basics

1. Import `CliApp` and `Commander` from the module.
2. Create your command object: `cmd = new CliApp.Command()`.
3. Initialize it with `cmd.init(ctx)` to apply output styling and `deno.json` values (`version`, `description`, `name`).
4. Add your own options using `cmd.option(...)` or by creating a `new Commander.Option(...)` and adding it with
   `cmd.addOption(...)`.
5. Use `cmd.addLogging(ctx)` to add standard logging CLI options.
6. Call `cmd.parseOpts()` to parse command line arguments.
7. Apply logging CLI options to `@epdoc/logger` using `CliApp.util.configureLogging(ctx, opts)`.
8. Optionally use the `CliApp.util.run` wrapper to log your application's termination consistently.

## Example

This example can be found in [purge.ts](./examples/purge.ts) which can be run using `deno run -S ./examples/purge.ts`.

```ts
import * as Log from 'jsr:@epdoc/logger@^1002.4';
import pkg from '../deno.json' with { type: 'json' };
// Import both CliApp and the Commander object
import * as CliApp from 'jsr:@epdoc/cliapp';

// deno run -A examples/basic.ts -t

type M = Log.MsgBuilder.Console.Builder;
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
