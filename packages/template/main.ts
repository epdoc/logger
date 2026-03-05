import * as CliApp from '@epdoc/cliapp';
import pkg from './deno.json' with { type: 'json' };
import { Ctx } from './src/deps.ts';
import * as App from './src/mod.ts';

if (import.meta.main) {
  const ctx = new Ctx.Context(pkg);
  await ctx.setupLogging({ pkg: 'template' });

  const cmd = new App.Cmd.Root(ctx, { root: true, dryRun: true });
  await cmd.init();

  await CliApp.run(ctx, cmd);
}
