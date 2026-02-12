import type * as App from '../app/mod.ts';
import * as Ctx from '../context.ts';

type ProcessCmdOpts = {
  more: boolean;
  name: string;
};

export class ProcessCommand extends Ctx.BaseRootCmdClass<ProcessCmdOpts> {
  override defineMetadata() {
    this.description = 'Process Nothing';
    this.name = 'process';
    this.aliases = 'proc';
  }

  override defineOptions(): void {
    const ctx = this.activeContext()!;
    ctx.log.info.section('ProcessCommand defineOptions').emit();
    this.option('--more', 'Show more info').emit();
    this.option('--name <string>', 'Provide a name').required().emit();
    ctx.log.info.h2('We added the process options and arguments.').emit();
    ctx.log.info.section().emit();
  }

  override async execute(opts: ProcessCmdOpts, _args: string[]): Promise<void> {
    this.ctx.log.info.section('ProcessCommand Execution').emit();
    const options: App.ProcessOpts = {
      more: opts.more,
      name: opts.name,
    };
    await this.ctx.app.processNothing(options);
    this.ctx.log.info.demo(this.ctx).emit();
    this.ctx.log.info.section().emit();
  }
}
