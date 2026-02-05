import pkg from '../../deno.json' with { type: 'json' };
import { Command } from '@epdoc/cliapp';
import type { ChildContext } from '../context.ts';

type SubOpts = {
  force?: boolean;
};

export class SubCommand extends Command<ChildContext, SubOpts> {
  constructor() {
    super(pkg);
    this
      .description('A sample subcommand')
      .argument('<input>', 'Input argument')
      .option('-f, --force', 'Force execution')
      .action((input: string, ...args: any[]) => {
        const opts = this.opts();
        
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
      });
  }
}
