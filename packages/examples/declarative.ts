/**
 * @file Declarative API examples
 * @description Multiple patterns for using the declarative command API
 */

import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import * as CliApp from '../cliapp/src/mod.ts';

type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

// Simple context for examples
class ExampleContext implements CliApp.ICtx<MsgBuilder, Logger> {
  log: Logger;
  logMgr: Log.Mgr<MsgBuilder>;
  dryRun = false;
  pkg: CliApp.DenoPkg = {
    name: 'example-app',
    version: '1.0.0',
    description: 'Declarative API examples',
  };

  constructor() {
    this.logMgr = Log.createLogManager(undefined, { threshold: 'info' });
    this.log = this.logMgr.getLogger<Logger>();
  }

  async close(): Promise<void> {
    await this.logMgr.close();
  }
}

// Example 1: Single command app
const singleCommandApp = CliApp.defineRootCommand({
  name: 'device-control',
  description: 'Control smart devices',
  options: {
    device: CliApp.option.string('--device <ip>', 'Device IP address').required(),
    action: CliApp.option.string('--action <cmd>', 'Action to perform').choices(['on', 'off', 'status']),
  },
  async action(opts, ctx) {
    ctx.log.info.h1('Device Control')
      .label('Device:').value(opts.device)
      .label('Action:').value(opts.action)
      .emit();
  },
});

// Example 2: Multi-command app
const fetchCmd = CliApp.defineCommand({
  name: 'fetch',
  description: 'Fetch data from source',
  options: {
    since: CliApp.option.date('--since <date>', 'Fetch data since this date'),
    limit: CliApp.option.number('--limit <n>', 'Maximum items to fetch').default(100),
  },
  async action(opts, ctx) {
    ctx.log.info.h1('Fetching Data')
      .label('Since:').value(opts.since?.toISOString() || 'beginning')
      .label('Limit:').value(opts.limit)
      .emit();
  },
});

const multiCommandApp = CliApp.defineRootCommand({
  name: 'data-processor',
  description: 'Process and export data',
  globalOptions: {
    profile: CliApp.option.string('--profile <name>', 'Profile to use').default('default'),
  },
  subcommands: [fetchCmd],
});

// Run examples
if (import.meta.main) {
  const example = Deno.args[0] || 'single';
  
  switch (example) {
    case 'single':
      await CliApp.createApp(singleCommandApp, () => new ExampleContext());
      break;
    case 'multi':
      await CliApp.createApp(multiCommandApp, () => new ExampleContext());
      break;
    default:
      console.log('Usage: deno run declarative.ts [single|multi]');
  }
}
