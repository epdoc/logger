import { Command, type CommandNode } from '../../cliffapp/src/mod.ts';
import type { AppContext } from './context.ts';
import { ctx } from './context.ts';

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
      action: (ctx, opts) => {
        ctx.log.info.text(`Hello, ${opts.name || 'World'}!`).emit();
      },
    },
  },
};

/**
 * A Class that hosts an object-literal subcommand (Hybrid).
 */
export class HybridCmd extends Command<AppContext> {
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
  console.log('--- Running Purely Declarative Tree ---');
  // Mocking arguments for the test
  const _oldArgs = Deno.args;
  // @ts-ignore: Mocking Deno.args
  Deno.args = ['hello', '--name', 'Antigravity'];

  const cmd = new Command(DECLARATIVE_TREE);
  await cmd.setContext(ctx);
  await cmd.init();
  await cmd.cmd.parse(Deno.args);

  console.log('\n--- Running Hybrid Class ---');
  const hybrid = new HybridCmd();
  await hybrid.setContext(ctx);
  await hybrid.init();
  // @ts-ignore: Mocking args
  Deno.args = ['hosted'];
  await hybrid.cmd.parse(Deno.args);
}

if (import.meta.main) {
  await runDemo();
}
