import * as CliApp from '@epdoc/cliapp';
import type { RootContext } from '../context.ts';

type SubOpts = CliApp.CmdOptions & {
  force?: boolean;
};

export class SubCommand extends CliApp.Cmd.AbstractBase<RootContext, RootContext, SubOpts> {
  override defineMetadata() {
    this.name = 'sub';
    this.description = 'A sample subcommand';
  }

  override async defineOptions(): Promise<void> {
    this.log.info.section('SubCommand defineOptions').emit();
    await Promise.resolve();
    this.commander
      .argument('<input>', 'Input argument')
      .option('-f, --force', 'Force execution');
    this.log.info.h2('We added the sub options and arguments.').emit();
    this.log.info.section().emit();
  }

  override execute(opts: SubOpts, args: CliApp.CmdArgs): void {
    const input = args[0];

    this.ctx.log.info.section('Subcommand Execution').emit();
    this.log.info.demo(this.ctx).emit();
    // Demonstrate using the custom params() method from CustomMsgBuilder
    this.ctx.log.info.label('Input').value(JSON.stringify(input)).emit();
    this.ctx.log.info.label('Force').value(opts.force ? 'Yes' : 'No').emit();
    this.ctx.log.info.label('Dry Run').value(this.ctx.dryRun ? 'Yes' : 'No').emit();
    if (this.ctx.dryRun) {
      this.ctx.log.warn.text('Dry run enabled, skipping actual work').emit();
    } else {
      this.ctx.log.info.text('Sub does not do anything').emit();
    }
    this.ctx.log.info.section().emit();
  }
}
