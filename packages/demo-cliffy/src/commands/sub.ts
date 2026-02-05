import type { ChildContext } from '../context.ts';
import { CliffApp } from '../dep.ts';

type SubOpts = {
  force?: boolean;
};

export class SubCommand extends CliffApp.Command<ChildContext, ChildContext, SubOpts> {
  protected override setupCommandOptions(): void {
    this.cmd
      .description('A sample subcommand')
      .arguments('<input:string>')
      .option('-f, --force', 'Force execution');
  }

  protected override action(opts: SubOpts, ...args: string[]): void {
    const [input] = args;

    this.ctx.log.info.h1('Subcommand Execution')
      .label('DebugMode').value(this.ctx.debugMode)
      .label('Input').value(JSON.stringify(input))
      .label('Force').value(opts.force ? 'Yes' : 'No')
      .label('Dry Run').value(this.ctx.dryRun ? 'Yes' : 'No')
      .emit();

    if (this.ctx.dryRun) {
      this.ctx.log.warn.text('Dry run enabled, skipping actual work').emit();
    } else {
      this.ctx.log.info.text('Performing actual work...').emit();
    }
  }
}
