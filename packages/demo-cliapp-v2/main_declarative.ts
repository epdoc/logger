import * as CliApp from '@epdoc/cliapp';
import pkg from './deno.json' with { type: 'json' };
import * as App from './src/mod.ts';

/**
 * Demo: Purely Declarative Implementation
 *
 * Demonstrates:
 * - Defining commands using CommandNode object literals
 * - Using createCommand factory to build command classes
 * - Nested subcommands as object literals
 * - Custom message builder with params() method
 */

const TREE: CliApp.CommandNode<App.Ctx.AppContext> = {
  name: pkg.name,
  version: pkg.version,
  description: 'Purely Declarative Demo',
  options: {
    '--name <name>': 'Your name',
  },
  subCommands: {
    hello: {
      description: 'Say hello',
      action: (ctx, opts) => {
        ctx.name = opts.name as string;
        ctx.log.info.text(`Hello, ${opts.name ?? 'World'}!`).emit();
        // Demonstrate custom params() method
        ctx.log.info.params(ctx).emit();
      },
    },
    goodbye: {
      description: 'Say goodbye',
      action: (ctx, opts) => {
        ctx.name = opts.name as string;
        ctx.log.info.text(`Goodbye, ${opts.name ?? 'World'}!`).emit();
        // Demonstrate custom params() method
        ctx.log.info.params(ctx).emit();
      },
    },
  },
};

if (import.meta.main) {
  const ctx = new App.Ctx.AppContext(pkg);
  await ctx.setupLogging();

  const RootCommand = CliApp.Cmd.create<App.Ctx.AppContext, App.Ctx.AppContext>(TREE, { root: true, dryRun: true });
  const rootCmd = new RootCommand();
  await rootCmd.init();

  CliApp.run(ctx, rootCmd);
}
