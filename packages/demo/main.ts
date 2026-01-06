import { Cmd, Ctx } from './src/mod.ts';

if (import.meta.main) {
  const ctx = new Ctx.Context();
  await ctx.setupLogging();
  const rootCmd = new Cmd.Root(ctx);
  const cmd = await rootCmd.init();
  await cmd.parseAsync();
}
