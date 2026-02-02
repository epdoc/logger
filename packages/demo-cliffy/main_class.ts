import { RootCommand } from './src/commands/root.ts';
import { AppContext } from './src/context.ts';
import { CliffApp } from './src/dep.ts';

/**
 * Demo 1: Pure Class-based Implementation
 * 
 * Demonstrates:
 * - Extending AbstractCmd
 * - Cascading context refinement with globalAction
 * - Functional subcommand resolution
 */
if (import.meta.main) {
  const ctx = new AppContext();
  await ctx.setupLogging();

  // Instantiate and initialize root command
  const rootCmd = new RootCommand();
  
  // The first setContext provides the initial context
  await rootCmd.setContext(ctx);
  await rootCmd.init();

  // Run the application
  await CliffApp.run(ctx, rootCmd.cmd);
}
