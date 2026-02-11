import type { ListOpts } from '../app/mod.ts';
import * as Ctx from '../context.ts';

type ListCmdOpts = {
  humanize: boolean;
};

export class ListCommand extends Ctx.BaseRootCmdClass<ListCmdOpts> {
  override defineMetadata() {
    this.description = 'List files';
    this.name = 'list';
  }

  override defineOptions() {
    const ctx = this.ctx || this.parentContext;
    ctx.log.info.section('ListCommand defineOptions').emit();
    this.option('-h --humanize', 'Human size output').emit();
    this.argument('[files...]', 'Files to list sizes of').emit();
    ctx.log.info.h2('We added the list options and arguments.').emit();
    ctx.log.info.section().emit();
  }

  override async execute(opts: ListCmdOpts, args: string[]): Promise<void> {
    this.ctx.log.info.section('ListCommand execute').emit();
    const options: ListOpts = { humanize: opts.humanize, files: args };
    await this.ctx.app.listFiles(options);
    this.ctx.log.info.section().emit();
  }
}
