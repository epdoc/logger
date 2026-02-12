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
    this.log.info.section('ListCommand defineOptions').emit();
    this.option('-h --humanize', 'Human size output').emit();
    this.argument('[files...]', 'Files to list sizes of').emit();
    this.addHelpText('\nThis is help text for the list command.');
    this.log.info.h2('We added the list options, arguments and help text.').emit();
    this.log.info.section().emit();
  }

  override async execute(opts: ListCmdOpts, args: string[]): Promise<void> {
    this.log.info.section('ListCommand execute').emit();
    const options: ListOpts = { humanize: opts.humanize, files: args };
    this.log.info.demo(this.ctx).emit();
    this.log.info.opts(options, 'ListOptions').emit();
    await this.ctx.app.listFiles(options);
    this.log.info.section().emit();
  }
}
