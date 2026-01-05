import * as CliApp from '@epdoc/cliapp';
import type { ListOpts } from '../app/mod.ts';
import type * as Ctx from '../context/mod.ts';

export class ListCmd extends CliApp.Cmd.Sub<CliApp.Cmd.ContextBundle<Ctx.Context>, ListOpts> {
  constructor(ctx: Ctx.Context) {
    super(ctx, 'list', 'List files');
  }

  protected override addArguments(): void {
    this.cmd.argument('[files...]', 'Files to list sizes of');
  }

  protected override addOptions(): void {
    this.cmd.option('-h --humanize', 'Human size output');
  }

  protected override async executeAction(
    args: string[],
    opts: ListOpts,
  ): Promise<void> {
    await this.ctx.app.listFiles(args, opts);
  }
}
