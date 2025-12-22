/**
 * @file Traditional imperative API example
 * @description Shows the original cliapp API for comparison and legacy projects
 */

import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import * as CliApp from '../cliapp/src/mod.ts';

type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

// Create context
const logMgr = Log.createLogManager(undefined, { threshold: 'info' });
const ctx: CliApp.ICtx<MsgBuilder, Logger> = {
  log: logMgr.getLogger<Logger>(),
  logMgr,
  dryRun: false,
  close: () => Promise.resolve(),
};

// Define custom options type
type CliOpts = CliApp.Opts & {
  input?: string;
  output?: string;
  format?: 'json' | 'csv' | 'xml';
  validate?: boolean;
};

async function run(): Promise<void> {
  // 1. Create command with package info
  const pkg = {
    name: 'legacy-processor',
    version: '1.0.0',
    description: 'Example using traditional imperative API',
  };
  
  const command = new CliApp.Command(pkg);
  
  // 2. Initialize with context
  command.init(ctx);
  
  // 3. Add custom options manually
  command.option('--input <file>', 'Input data file');
  command.option('--output <file>', 'Output file path');
  command.option('--format <type>', 'Output format', 'json');
  command.option('--validate', 'Validate data before processing');
  
  // 4. Add standard logging options
  command.addLogging(ctx);
  
  // 5. Parse command line
  const opts = await command.parseOpts() as CliOpts;
  
  // 6. Configure logging based on CLI options
  CliApp.configureLogging(ctx, opts);
  
  // 7. Business logic
  ctx.log.info.h1('Traditional API Example').emit();
  ctx.log.info.label('Input:').value(opts.input || 'none').emit();
  ctx.log.info.label('Output:').value(opts.output || 'stdout').emit();
  ctx.log.info.label('Format:').value(opts.format || 'json').emit();
  ctx.log.info.label('Validate:').value(opts.validate ? 'yes' : 'no').emit();
  ctx.log.info.label('Dry Run:').value(ctx.dryRun ? 'yes' : 'no').emit();
  
  ctx.log.info.text('Processing complete (traditional API)').emit();
}

if (import.meta.main) {
  await CliApp.run(ctx, run);
}
