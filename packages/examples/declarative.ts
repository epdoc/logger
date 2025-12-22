/**
 * @file Example demonstrating the new declarative command API
 * @description Shows how to create both single-command and multi-command apps
 */

import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import * as CliApp from '../cliapp/src/mod.ts';

// Types for this example
type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

// Simple context for the example
class ExampleContext implements CliApp.ICtx<MsgBuilder, Logger> {
  log: Logger;
  logMgr: Log.Mgr<MsgBuilder>;
  dryRun = false;
  pkg: CliApp.DenoPkg = {
    name: 'example-app',
    version: '1.0.0',
    description: 'Example declarative CLI app'
  };

  constructor() {
    this.logMgr = new Log.Mgr<MsgBuilder>().init();
    this.logMgr.threshold = 'info';
    this.log = this.logMgr.getLogger<Logger>();
  }

  async close(): Promise<void> {
    await this.logMgr.close();
  }
}

// Example 1: Single command app (like tplink)
const singleCommandApp = CliApp.defineRootCommand({
  name: 'device-control',
  description: 'Control smart devices',
  options: {
    device: CliApp.option.string('--device <ip>', 'Device IP address').required(),
    action: CliApp.option.string('--action <cmd>', 'Action to perform').choices(['on', 'off', 'status'])
  },
  async action(opts, ctx) {
    ctx.log.info.h1('Device Control')
      .label('Device:').value(opts.device)
      .label('Action:').value(opts.action)
      .emit();
    
    // Business logic would go here
    ctx.log.info.text(`Executing ${opts.action} on device ${opts.device}`).emit();
  }
});

// Example 2: Multi-command app (like finsync)
const fetchCmd = CliApp.defineCommand({
  name: 'fetch',
  description: 'Fetch data from source',
  options: {
    since: CliApp.option.date('--since <date>', 'Fetch data since this date'),
    limit: CliApp.option.number('--limit <n>', 'Maximum items to fetch').default(100),
    format: CliApp.option.string('--format <type>', 'Output format').choices(['json', 'csv']).default('json')
  },
  async action(opts, ctx) {
    ctx.log.info.h1('Fetching Data')
      .label('Since:').value(opts.since?.toISOString() || 'beginning')
      .label('Limit:').value(opts.limit)
      .label('Format:').value(opts.format)
      .emit();
    
    // Business logic would go here
    ctx.log.info.text(`Fetching up to ${opts.limit} items in ${opts.format} format`).emit();
  }
});

const exportCmd = CliApp.defineCommand({
  name: 'export',
  description: 'Export processed data',
  options: {
    output: CliApp.option.path('--output <path>', 'Output directory').default('./output'),
    providers: CliApp.option.array('--providers <list>', 'Comma-separated list of providers')
  },
  async action(opts, ctx) {
    ctx.log.info.h1('Exporting Data')
      .label('Output:').value(opts.output)
      .label('Providers:').value(opts.providers?.join(', ') || 'all')
      .emit();
    
    // Business logic would go here
    ctx.log.info.text(`Exporting to ${opts.output}`).emit();
  }
});

const multiCommandApp = CliApp.defineRootCommand({
  name: 'data-processor',
  description: 'Process and export data',
  globalOptions: {
    profile: CliApp.option.string('--profile <name>', 'Profile to use').default('default'),
    offline: CliApp.option.boolean('--offline', 'Work in offline mode')
  },
  subcommands: [fetchCmd, exportCmd]
});

// Example 3: Root with default action + subcommands (like bikelog)
const generateCmd = CliApp.defineCommand({
  name: 'generate',
  description: 'Generate reports',
  options: {
    template: CliApp.option.string('--template <name>', 'Template to use').default('standard')
  },
  async action(opts, ctx) {
    ctx.log.info.h1('Generating Report')
      .label('Template:').value(opts.template)
      .emit();
  }
});

const hybridApp = CliApp.defineRootCommand({
  name: 'report-tool',
  description: 'Generate PDF reports',
  options: {
    year: CliApp.option.number('--year <yyyy>', 'Report year').default(new Date().getFullYear()),
    output: CliApp.option.path('--output <path>', 'Output directory').default('./reports')
  },
  async action(opts, ctx) {
    // Default action when no subcommand is specified
    ctx.log.info.h1('Generating Default Report')
      .label('Year:').value(opts.year)
      .label('Output:').value(opts.output)
      .emit();
  },
  subcommands: [generateCmd] // Additional utility commands
});

// Run examples based on command line argument
if (import.meta.main) {
  const example = Deno.args[0] || 'single';
  
  switch (example) {
    case 'single':
      console.log('Running single-command app example...');
      await CliApp.createApp(singleCommandApp, () => new ExampleContext());
      break;
    case 'multi':
      console.log('Running multi-command app example...');
      await CliApp.createApp(multiCommandApp, () => new ExampleContext());
      break;
    case 'hybrid':
      console.log('Running hybrid app example...');
      await CliApp.createApp(hybridApp, () => new ExampleContext());
      break;
    default:
      console.log('Usage: deno run declarative.ts [single|multi|hybrid]');
  }
}
