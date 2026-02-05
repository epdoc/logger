import { RootCommand } from './src/commands/root.ts';
import { AppContext } from './src/context.ts';
import { CliffApp } from './src/dep.ts';

if (import.meta.main) {
  const ctx = new AppContext();
  await ctx.setupLogging();

  // Instantiate and initialize root command
  const rootCmd = new RootCommand();
  rootCmd.setContext(ctx);
  rootCmd.init();

  // Run the application using the underlying Cliffy Command
  await CliffApp.run(ctx, rootCmd.cmd);
}
