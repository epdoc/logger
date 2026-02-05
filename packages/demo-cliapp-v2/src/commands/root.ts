import * as CliApp from '@epdoc/cliapp';
import pkg from '../../deno.json' with { type: 'json' };
import { type AppContext, ChildContext } from '../context.ts';
import { SubCommand } from './sub.ts';

type RootOpts = CliApp.CmdOptions & { debugMode: boolean };

export class RootCommand extends CliApp.Command<AppContext, RootOpts, ChildContext> {
  // Static subcommands for testing
  protected override subCommands = {
    sub: SubCommand,
  };

  protected override deriveChildContext(ctx: AppContext, opts: RootOpts, _args: string[]): Promise<ChildContext> {
    const childCtx: ChildContext = new ChildContext(ctx) as ChildContext;
    childCtx.name = 'main_class';

    if (opts.debugMode) {
      childCtx.debugMode = true;
      ctx.log.info.text('Refining context: setting debugMode = true').emit();
    }

    return Promise.resolve(childCtx);
  }

  constructor() {
    super(pkg);
    this
      .description('Demo of enhanced CliApp v2.0')
      .option('--debug-mode', 'Enable special debug mode for context refinement demo')
      .action((...args: RootOpts[]) => {
        const opts = this.opts();
        // Show help when no subcommand is provided
        this.ctx.log.info.text('Root command options:').emit();
        this.ctx.log.indent();
        this.ctx.log.info.label('debugMode').value(opts.debugMode).emit();
        this.ctx.log.info.label('args:').value(args.join(',')).emit();
        this.ctx.log.outdent();
        if (args.length === 0) {
          this.help();
        }
      });
  }
}
