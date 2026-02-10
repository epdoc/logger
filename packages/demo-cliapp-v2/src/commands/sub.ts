import * as CliApp from '@epdoc/cliapp';
import type { AppContext } from '../context.ts';

type SubOpts = CliApp.CmdOptions & {
  force?: boolean;
};

export class SubCommand extends CliApp.Cmd.AbstractBase<AppContext, AppContext, SubOpts> {
  constructor() {
    super(undefined, {
      name: 'sub',
      description: 'A sample subcommand',
    });
  }

  override async defineOptions(): Promise<void> {
    await Promise.resolve();
    this.commander
      .argument('<input>', 'Input argument')
      .option('-f, --force', 'Force execution');
  }

  override execute(opts: SubOpts, args: CliApp.CmdArgs): void {
    const input = args[0];

    this.ctx.log.info.h1('Subcommand Execution').emit();
    this.ctx.log.indent();
    // Demonstrate using the custom params() method from CustomMsgBuilder
    this.ctx.log.info.params(this.ctx).emit();
    this.ctx.log.info
      .label('Input').value(JSON.stringify(input))
      .label('Force').value(opts.force ? 'Yes' : 'No')
      .label('Dry Run').value(this.ctx.dryRun ? 'Yes' : 'No')
      .emit();
    this.ctx.log.outdent();

    if (this.ctx.dryRun) {
      this.ctx.log.warn.text('Dry run enabled, skipping actual work').emit();
    } else {
      this.ctx.log.info.text('Performing actual work...').emit();
    }
  }
}
