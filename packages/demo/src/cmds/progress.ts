import * as CliApp from '@epdoc/cliapp';
import type { RootContext } from '../context.ts';
import { App } from '../mod.ts';

type ProgressCmdOpts = CliApp.CmdOptions & {
  force?: boolean;
};

export class ProgressCommand extends CliApp.Cmd.AbstractBase<RootContext, RootContext, ProgressCmdOpts> {
  override defineMetadata() {
    this.name = 'progress';
    this.description = 'A sample subcommand';
  }

  override async defineOptions(): Promise<void> {
    this.log.info.section('ProgressCommand defineOptions').emit();
    await Promise.resolve();
    this.log.info.h2('We added the progress options and arguments.').emit();
    this.log.info.section().emit();
  }

  override async execute(_opts: ProgressCmdOpts, args: CliApp.CmdArgs): Promise<void> {
    this.ctx.log.info.section('ProgressCommand Execution').emit();
    this.log.info.demo(this.ctx).emit();
    // Demonstrate using the custom params() method from CustomMsgBuilder

    const app = new App.Main(this.ctx);
    await app.progressDemo();
  }
}
