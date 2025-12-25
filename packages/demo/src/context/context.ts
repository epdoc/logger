import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import pkg from '../../deno.json' with { type: 'json' };
import * as App from '../app/mod.ts';
import { CustomBuilder } from './msgbuilder.ts';

export type MsgBuilder = InstanceType<typeof CustomBuilder>;
export type Logger = Log.Std.Logger<MsgBuilder>;

// Bundle context types together
export type AppBundle = CliApp.Cmd.ContextBundle<Context, MsgBuilder, Logger>;

export class Context extends CliApp.Ctx.Base<MsgBuilder, Logger> {
  // Add application state [example]
  app: App.Main;

  constructor() {
    super(pkg);
    this.setupLogging();
    this.app = new App.Main(this);
  }

  setupLogging() {
    this.logMgr = Log.createLogManager(CustomBuilder, { threshold: 'info' });
    this.log = this.logMgr.getLogger<Logger>();
  }
}
