import type { GlobalOptions } from '@epdoc/cliffapp';
import { type AppContext, ChildContext } from '../context.ts';
import { CliffApp } from '../dep.ts';
import { SubCommand } from './sub.ts';

type RootOpts = GlobalOptions & { debugMode: boolean };

export class RootCommand extends CliffApp.Command<AppContext, ChildContext, RootOpts> {
  // Static subcommands for testing
  protected override subCommands = {
    sub: SubCommand,
  };

  protected override deriveChildContext(
    ctx: AppContext,
    opts: RootOpts,
    _args: CliffApp.CmdArgs,
  ): Promise<ChildContext> {
    const childCtx: ChildContext = new ChildContext(ctx, { pkg: 'root' }) as ChildContext;
    childCtx.name = 'main_class';

    if (opts.debugMode) {
      childCtx.debugMode = true;
      ctx.log.info.text('Refining context: setting debugMode = true').emit();
    }

    return Promise.resolve(childCtx);
  }

  protected override setupCommandOptions(): void {
    this.cmd
      .name(this.ctx.pkg.name)
      .version(this.ctx.pkg.version)
      .description(this.ctx.pkg.description!)
      .option('--debug-mode', 'Enable special debug mode for context refinement demo');
  }

  protected override action(opts: RootOpts, ...args: string[]): void {
    // Show help when no subcommand is provided
    this.info.text('Root command options:').emit();
    this.log.indent();
    this.info.label('debugMode').value(opts.debugMode).emit();
    this.info.label('args:').value(args.join(',')).emit();
    this.log.outdent();
    if (args.length === 0) {
      this.cmd.showHelp();
    }
  }
}
