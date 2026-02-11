import * as CliApp from '@epdoc/cliapp';
import pkg from './deno.json' with { type: 'json' };
import * as App from './src/mod.ts';

/**
 * Demo: Enhanced CliApp v2.0 with automatic context flow
 *
 * Demonstrates:
 * - Clean context inheritance using AbstractBase
 * - Automatic subcommand registration
 * - Type-safe context transformation
 * - Commander.js stability
 * - Automatic logging configuration
 * - Custom message builder with params() method
 */
if (import.meta.main) {
  const ctx = new App.Ctx.RootContext(pkg, { pkg: 'app' });
  await ctx.setupLogging();

  const rootCmd = new App.Cmd.Root(ctx);
  await rootCmd.init();

  CliApp.run(ctx, rootCmd);
}
