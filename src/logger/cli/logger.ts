import { LogMgr } from '../../logmgr.ts';
import { MsgBuilder } from '../../message/index.ts';
import { Logger as CoreLogger } from '../logger.ts';
import { LogRecord } from '../types.ts';
import type { ILogger } from './levels.ts';

export function getLogger(logMgr: LogMgr) {
  return new Logger(logMgr);
}

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
