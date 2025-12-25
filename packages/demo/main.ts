import { Cmd, Ctx } from './src/mod.ts';

if (import.meta.main) {
  const ctx = new Ctx.Context();
  const rootCmd = new Cmd.Root(ctx);
  const cmd = await rootCmd.init();
  await cmd.parseAsync();
}
