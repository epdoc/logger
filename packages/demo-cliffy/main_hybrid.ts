import { SubCommand } from './src/commands/sub.ts';
import { AppContext } from './src/context.ts';
import { CliffApp } from './src/dep.ts';

/**
 * Demo 3: Hybrid Implementation
 * 
 * Demonstrates:
 * - Mixing AbstractCmd classes with CommandNode object literals
 * - Class-based root with procedural/declarative leaves
 */

export class HybridRoot extends CliffApp.Command<AppContext> {
  protected override subCommands = {
    // 1. A class-based subcommand
    standard: SubCommand,

    // 2. A purely declarative subcommand
    declarative: {
      description: 'A declarative leaf in a class-based tree',
      options: {
        '--shout': 'Shout the message',
      },
      action: (ctx, opts) => {
        let msg = 'Hello from the declarative node!';
        if (opts.shout) msg = msg.toUpperCase();
        ctx.log.info.text(msg).emit();
      },
      subCommands: {
        nested: {
          description: 'A nested declarative command',
          action: (ctx) => {
            ctx.log.info.text('Deep nested success!').emit();
          }
        }
      }
    } as CliffApp.CommandNode<AppContext>,
  };

  protected override setupOptions(): void {
    this.cmd
      .name('hybrid-demo')
      .description('Hybrid CLI mixing classes and objects');
    
    CliffApp.addLoggingOptions(this.cmd, this.ctx);
  }
}

if (import.meta.main) {
  const ctx = new AppContext();
  await ctx.setupLogging();

  const root = new HybridRoot();
  await root.setContext(ctx);
  await root.init();

  await CliffApp.run(ctx, root.cmd);
}
