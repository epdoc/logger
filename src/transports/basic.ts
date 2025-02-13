import type { LogMgr } from '../logmgr.ts';
import type * as MsgBuilder from '../message/index.ts';

export class Basic<M extends MsgBuilder.IBasic> {
  protected _logMgr: LogMgr<M>;

  constructor(logMgr: LogMgr<M>) {
    this._logMgr = logMgr;
  }

  thresholdUpdated(): this {
    return this;
  }
}
