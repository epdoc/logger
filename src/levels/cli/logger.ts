import * as CoreLogger from '../../logger/index.ts';
import { LogMgr } from '../../logmgr.ts';
import * as MsgBuilder from '../../message/index.ts';
import type * as Log from '../../types.ts';
import type * as cli from './types.ts';

export const getLogger: CoreLogger.FactoryMethod = (
  log: LogMgr | Log.IEmitter,
  opts: Log.GetChildOpts = {}
) => {
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

export class Logger extends CoreLogger.Basic implements cli.ILogger {
  constructor(logMgr: LogMgr) {
    super(logMgr);
  }

  override copy(): Logger {
    const result = new Logger(this._logMgr);
    result.assign(this);
    return result;
  }

  override emit(msg: Log.Entry): void {
    if (this.meetsThreshold(msg.level)) {
      console.log(msg.msg);
    }
  }

  get error(): MsgBuilder.Console {
    return new MsgBuilder.Console('ERROR', this);
  }
  get warn(): MsgBuilder.Console {
    return new MsgBuilder.Console('WARN', this);
  }
  get help(): MsgBuilder.Console {
    return new MsgBuilder.Console('HELP', this);
  }
  get data(): MsgBuilder.Console {
    return new MsgBuilder.Console('DATA', this);
  }
  get info(): MsgBuilder.Console {
    return new MsgBuilder.Console('INFO', this);
  }
  get debug(): MsgBuilder.Console {
    return new MsgBuilder.Console('DEBUG', this);
  }
  get prompt(): MsgBuilder.Console {
    return new MsgBuilder.Console('PROMPT', this);
  }
  get verbose(): MsgBuilder.Console {
    return new MsgBuilder.Console('VERBOSE', this);
  }
  get input(): MsgBuilder.Console {
    return new MsgBuilder.Console('INPUT', this);
  }
  get silly(): MsgBuilder.Console {
    return new MsgBuilder.Console('SILLY', this);
  }
}
