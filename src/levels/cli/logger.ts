import * as Logger from '../../logger/index.ts';
import { LogMgr } from '../../logmgr.ts';
import type * as MsgBuilder from '../../message/index.ts';
import type * as cli from './types.ts';

export const getLogger = <M extends MsgBuilder.IBasic>(
  log: LogMgr<M> | Logger.IEmitter,
  params?: Logger.IGetChildParams,
): CliLogger<M> => {
  if (log instanceof LogMgr) {
    return new CliLogger<M>(log, params);
  } else if (log instanceof CliLogger) {
    return log.getChild(params) as CliLogger<M>;
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

export class CliLogger<M extends MsgBuilder.IBasic> extends Logger.Indent<M> implements cli.ILogger<M> {
  constructor(logMgr: LogMgr<M>, params?: Logger.IGetChildParams) {
    super(logMgr, params);
  }

  override copy(): this {
    const result = new (this.constructor as new (logMgr: LogMgr<M>) => this)(this._logMgr);
    result.assign(this);
    return result;
  }

  get error(): M {
    return this._logMgr.getMsgBuilder('ERROR', this);
  }
  get warn(): M {
    return this._logMgr.getMsgBuilder('WARN', this);
  }
  get help(): M {
    return this._logMgr.getMsgBuilder('HELP', this);
  }
  get data(): M {
    return this._logMgr.getMsgBuilder('DATA', this);
  }
  get info(): M {
    return this._logMgr.getMsgBuilder('INFO', this);
  }
  get debug(): M {
    return this._logMgr.getMsgBuilder('DEBUG', this);
  }
  get prompt(): M {
    return this._logMgr.getMsgBuilder('PROMPT', this);
  }
  get verbose(): M {
    return this._logMgr.getMsgBuilder('VERBOSE', this);
  }
  get input(): M {
    return this._logMgr.getMsgBuilder('INPUT', this);
  }
  get silly(): M {
    return this._logMgr.getMsgBuilder('SILLY', this);
  }
}
