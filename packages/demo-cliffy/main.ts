/**
 * @file Entry point for demo-cliffy
 */

import { AppContext } from './src/context.ts';
import { createRootCommand } from './src/commands/root.ts';
import { CliffApp } from './src/dep.ts';

if (import.meta.main) {
  const ctx = new AppContext();
  await ctx.setupLogging();
  const rootCmd = createRootCommand(ctx);
  
  await CliffApp.run(ctx, rootCmd);
}
