import type { AppContext } from '../context.ts';
import { CliffApp } from '../dep.ts';

type SubOpts = {
  force?: boolean;
};

export class SubCommand extends CliffApp.AbstractCmd<AppContext> {
  protected override setupOptions(): void {
    this.cmd
      .name('sub')
      .description('A sample subcommand')
      .arguments('<input:string>')
      .option('-f, --force', 'Force execution');
  }

  protected override setupAction(): void {
    this.cmd.action((opts: unknown, ...args: unknown[]) => {
      const { force } = opts as SubOpts;
      const [input] = args as [string];
      this.ctx.log.info.h1('Subcommand Execution')
        .label('Input').value(input)
        .label('Force').value(force ? 'Yes' : 'No')
        .label('Dry Run').value(this.ctx.dryRun ? 'Yes' : 'No')
        .emit();

      if (this.ctx.dryRun) {
        this.ctx.log.warn.text('Dry run enabled, skipping actual work').emit();
      } else {
        this.ctx.log.info.text('Performing actual work...').emit();
      }
    });
  }
}
