import pkg from './deno.json' with { type: 'json' };
import { run } from '@epdoc/cliapp';
import { RootCommand } from './src/commands/root.ts';
import { AppContext } from './src/context.ts';

/**
 * Demo: Enhanced CliApp v2.0 with automatic context flow
 * 
 * Demonstrates:
 * - Clean context inheritance
 * - Automatic subcommand registration
 * - Type-safe context transformation
 * - Commander.js stability
 * - Automatic logging configuration
 */
if (import.meta.main) {
  const ctx = new AppContext(pkg);
  await ctx.setupLogging();

  // Instantiate and initialize root command
  const rootCmd = new RootCommand();
  
  // Clean initialization - context flows automatically, logging added automatically
  await rootCmd.init(ctx);

  // Enhanced run with automatic logging configuration
  await run(ctx, rootCmd);
}
