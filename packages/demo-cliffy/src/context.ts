/**
 * @file Application Context for demo-cliffy
 */

import type { Console } from '@epdoc/msgbuilder';
import pkg from '../deno.json' with { type: 'json' };
import { type CliffApp, Logger } from './dep.ts';

export type MsgBuilder = Console.Builder;
export type AppLogger = Logger.Std.Logger<MsgBuilder>;

export class AppContext implements CliffApp.ICtx<MsgBuilder, AppLogger> {
  log!: AppLogger;
  logMgr!: Logger.Mgr<MsgBuilder>;
  dryRun = false;
  debugMode = false;
  pkg = {
    name: pkg.name,
    version: pkg.version,
    description: 'A demo application using Cliffy and @epdoc/logger',
  };

  constructor() {
    // Setup logging must be called explicitly and awaited
  }

  async setupLogging() {
    this.logMgr = new Logger.Mgr<MsgBuilder>();
    this.logMgr.initLevels();
    this.logMgr.threshold = 'info';
    this.log = await this.logMgr.getLogger<AppLogger>();
  }

  async close() {
    await this.logMgr.close();
  }
}

export const ctx = new AppContext();
await ctx.setupLogging();
