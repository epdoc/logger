import * as CliApp from '@epdoc/cliapp';
import pkg from './deno.json' with { type: 'json' };
import * as App from './src/mod.ts';

if (import.meta.main) {
  const ctx = new App.Ctx.RootContext(pkg);
  await ctx.setupLogging({ pkg: 'app' });

  const rootCmd = new App.Cmd.Root(ctx);
  await rootCmd.init();

  CliApp.run(ctx, rootCmd);
}
