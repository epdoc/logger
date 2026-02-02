import { AppContext } from './src/context.ts';
import { CliffApp } from './src/dep.ts';

/**
 * Demo 2: Purely Declarative Implementation
 * 
 * Demonstrates:
 * - Defining commands using CommandNode object literals
 * - Using CommandEngine to run the tree
 * - Nested subcommands as object literals
 */

const TREE: CliffApp.CommandNode<AppContext> = {
  description: 'Purely Declarative Demo',
  setupGlobalAction: (cmd, ctx) => {
    CliffApp.addLoggingOptions(cmd, ctx);
  },
  options: {
    '--name <name:string>': {
      description: 'Your name',
      default: 'World',
    },
  },
  subCommands: {
    hello: {
      description: 'Say hello',
      action: async (ctx, opts) => {
        ctx.log.info.text(`Hello, ${opts.name}!`).emit();
      },
    },
    goodbye: {
      description: 'Say goodbye',
      action: async (ctx, opts) => {
        ctx.log.info.text(`Goodbye, ${opts.name}!`).emit();
      },
    },
  },
};

if (import.meta.main) {
  const ctx = new AppContext();
  await ctx.setupLogging();

  const engine = new CliffApp.CommandEngine(ctx);
  await engine.run(TREE);
}
