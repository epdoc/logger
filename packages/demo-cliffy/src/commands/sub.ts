/**
 * @file Sample subcommand for demo-cliffy
 */

import { Command } from '@cliffy/command';
import { AppContext } from '../context.ts';

export function createSubCommand(ctx: AppContext) {
  return new Command()
    .name('sub')
    .description('A sample subcommand')
    .arguments('<input:string>')
    .option('-f, --force', 'Force execution')
    .action((opts, input) => {
      ctx.log.info.h1('Subcommand Execution')
        .label('Input').value(input)
        .label('Force').value(opts.force ? 'Yes' : 'No')
        .label('Dry Run').value(ctx.dryRun ? 'Yes' : 'No')
        .emit();
        
      if (ctx.dryRun) {
        ctx.log.warn.text('Dry run enabled, skipping actual work').emit();
      } else {
        ctx.log.info.text('Performing actual work...').emit();
      }
    });
}
