import { Logger as CoreLogger } from '../../logger.ts';
import { LogMgr } from '../../logmgr.ts';
import { MsgBuilder } from '../../message/console.ts';
import { GetChildOpts, ILogEmitter, LoggerFactoryMethod, LogRecord } from '../../types.ts';
import type { ILogger } from './types.ts';

export const getLogger: LoggerFactoryMethod = (log: LogMgr | ILogEmitter, opts: GetChildOpts = {}) => {
  if (log instanceof LogMgr) {
    return new Logger(log).setReqId(opts.reqId).setPackage(opts.pkg);
  } else if (log instanceof Logger) {
    return log.getChild(opts);
  }
  throw new Error('Invalid logger type');
};

/**
 * Logger that implements CLI levels. These levels are:
 *  - error
 *  - warn
 *  - help
 *  - data
 *  - info
 *  - debug
 *  - prompt
 *  - verbose
 *  - input
 *  - silly
 */

export class Logger extends CoreLogger implements ILogger {
  constructor(logMgr: LogMgr) {
    super(logMgr);
  }

  override copy(): Logger {
    const result = new Logger(this._logMgr);
    result.assign(this);
    return result;
  }

  override emit(msg: LogRecord): void {
    if (this.meetsThreshold(msg.level)) {
      console.log(msg.msg);
    }
  }

  get error(): MsgBuilder {
    return new MsgBuilder('ERROR', this);
  }
  get warn(): MsgBuilder {
    return new MsgBuilder('WARN', this);
  }
  get help(): MsgBuilder {
    return new MsgBuilder('HELP', this);
  }
  get data(): MsgBuilder {
    return new MsgBuilder('DATA', this);
  }
  get info(): MsgBuilder {
    return new MsgBuilder('INFO', this);
  }
  get debug(): MsgBuilder {
    return new MsgBuilder('DEBUG', this);
  }
  get prompt(): MsgBuilder {
    return new MsgBuilder('PROMPT', this);
  }
  get verbose(): MsgBuilder {
    return new MsgBuilder('VERBOSE', this);
  }
  get input(): MsgBuilder {
    return new MsgBuilder('INPUT', this);
  }
  get silly(): MsgBuilder {
    return new MsgBuilder('SILLY', this);
  }
}
