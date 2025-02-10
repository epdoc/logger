import type { LogMgr } from '../logmgr.ts';

export class Basic {
  protected _logMgr: LogMgr;

  constructor(logMgr: LogMgr) {
    this._logMgr = logMgr;
  }

  thresholdUpdated(): this {
    return this;
  }
}
