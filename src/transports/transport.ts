import { Logger } from '../logger.ts';
import type { LogMgr } from '../logmgr.ts';
import type { LogRecord } from '../types.ts';

export interface ITransport {
  emit(msg: LogRecord, logger: Logger): void;
}

export class Transport {
  protected _logMgr: LogMgr;

  constructor(logMgr: LogMgr) {
    this._logMgr = logMgr;
  }
}
