import { Logger, LogRecord } from '../logger/index.ts';
import type { LogMgr } from '../logmgr.ts';

export interface ITransport {
  emit(msg: LogRecord, logger: Logger): void;
}

export class Transport {
  protected _logMgr: LogMgr;

  constructor(logMgr: LogMgr) {
    this._logMgr = logMgr;
  }
}
