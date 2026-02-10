import * as CliApp from '@epdoc/cliapp';
import pkg from './deno.json' with { type: 'json' };
import * as App from './src/mod.ts';

if (import.meta.main) {
  const ctx = new App.Ctx.AppContext(pkg);
  await ctx.setupLogging();

  const RootCommand = CliApp.Cmd.create<App.Ctx.AppContext, App.Ctx.AppContext>(
    App.Decl.TREE,
    { root: true, dryRun: true, version: pkg.version },
  );
  const rootCmd = new RootCommand(ctx);
  await rootCmd.init();

  CliApp.run(ctx, rootCmd);
}
