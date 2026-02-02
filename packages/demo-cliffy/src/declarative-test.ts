import { AbstractCmd, CommandEngine, CommandNode } from '../../cliffapp/src/mod.ts';
import { AppContext, ctx } from './context.ts';

/**
 * A purely declarative command tree.
 */
const DECLARATIVE_TREE: CommandNode<AppContext> = {
  description: 'Purely Declarative Demo',
  options: {
    '--name <name:string>': 'Your name',
  },
  subCommands: {
    hello: {
      description: 'Say hello',
      action: async (ctx, opts) => {
        ctx.log.info.text(`Hello, ${opts.name || 'World'}!`).emit();
      },
    },
  },
};

/**
 * A Class that hosts an object-literal subcommand (Hybrid).
 */
export class HybridCmd extends AbstractCmd<AppContext> {
  protected override subCommands = {
    // Hosted object literal
    hosted: {
      description: 'A subcommand defined as an object literal',
      action: (ctx: AppContext) => {
        ctx.log.info.text('Greetings from the hosted object!').emit();
      },
    },
  };

  protected override setupOptions(): void {
    this.cmd.description('Hybrid Class-based command');
  }
}

async function runDemo() {
  const engine = new CommandEngine(ctx);

  console.log('--- Running Purely Declarative Tree ---');
  // Mocking arguments for the test
  const oldArgs = Deno.args;
  // @ts-ignore: Mocking Deno.args
  Deno.args = ['hello', '--name', 'Antigravity'];
  await engine.run(DECLARATIVE_TREE);

  console.log('\n--- Running Hybrid Class ---');
  const hybrid = new HybridCmd();
  hybrid.setContext(ctx);
  hybrid.init();
  // @ts-ignore: Mocking args
  Deno.args = ['hosted'];
  await hybrid.cmd.parse(Deno.args);
}

if (import.meta.main) {
  await runDemo();
}
