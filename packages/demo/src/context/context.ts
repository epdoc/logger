import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import pkg from '../../deno.json' with { type: 'json' };
import * as App from '../app/mod.ts';
import { CustomBuilder } from './msgbuilder.ts';

export type Logger = Log.Std.Logger<CustomBuilder>;

export class Context extends CliApp.Ctx.Base<Logger> {
  // Add application state [example]
  app: App.Main;

  constructor() {
    super(pkg);
    this.setupLogging();
    this.app = new App.Main(this);
  }

  setupLogging() {
    this.logMgr = new Log.Mgr<CustomBuilder>();
    this.logMgr.msgBuilderFactory = (emitter) => new CustomBuilder(emitter);
    this.logMgr.init(Log.Std.factoryMethods);
    this.logMgr.threshold = 'info';
    this.log = this.logMgr.getLogger<Logger>();
  }
}
