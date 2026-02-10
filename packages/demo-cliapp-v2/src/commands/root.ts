import * as CliApp from '@epdoc/cliapp';
import type { AppContext } from '../context.ts';
import { SubCommand } from './sub.ts';

type RootOpts = CliApp.CmdOptions & { happyMode?: boolean };

export class RootCommand extends CliApp.Cmd.AbstractBase<AppContext, AppContext, RootOpts> {
  constructor(ctx: AppContext) {
    super(ctx, { root: true, dryRun: true });
  }

  override defineOptions(): Promise<void> {
    this.option('--happy-mode', 'Enable special happy mode on the RootCommand').emit();
    return Promise.resolve();
  }

  override createContext(parent?: AppContext): AppContext {
    return parent ?? this.ctx;
  }

  override async hydrateContext(opts: RootOpts, _args: CliApp.CmdArgs): Promise<void> {
    await this.ctx.setupLogging();
    if (opts.happyMode) {
      this.ctx.happyMode = true;
      this.ctx.log.info.text('Happy mode enabled').emit();
    }
  }

  override execute(_opts: RootOpts, _args: CliApp.CmdArgs): void {
    this.ctx.log.info.section('Root command execute').emit();
    this.ctx.log.indent();
    // Demonstrate using the custom params() method from CustomMsgBuilder
    this.ctx.log.info.happy(this.ctx).emit();
    this.ctx.log.info.label('dryRun').value(this.ctx.dryRun).emit();
    this.ctx.log.outdent();
    this.ctx.log.info.section().emit();
    this.commander.help();
  }

  protected override getSubCommands(): CliApp.Cmd.AbstractBase<AppContext, AppContext>[] {
    return [new SubCommand()];
  }
}
