import * as CliApp from '@epdoc/cliapp';
import type * as App from '../app/mod.ts';
import type * as Ctx from '../context/mod.ts';

export class ProcessCmd extends CliApp.Cmd.Sub<Ctx.AppBundle, App.ProcessOpts> {
  constructor(ctx: Ctx.Context) {
    super(ctx, 'process', 'Process files');
  }

  protected override addOptions(): void {
    this.cmd.option('--more', 'Show more info');
    this.cmd.option('--name <string>', 'Provide a name');
  }

  protected override async executeAction(
    args: string[],
    opts: App.ProcessOpts,
  ): Promise<void> {
    await this.ctx.app.processNothing(args, opts);
  }
}
