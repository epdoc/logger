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

  const cmd = new CliffApp.Command(TREE);
  await cmd.setContext(ctx);
  await cmd.init();
  await cmd.cmd.parse(Deno.args);
}
