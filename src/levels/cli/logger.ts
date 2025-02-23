import * as Logger from '../../logger/index.ts';
import { LogMgr } from '../../logmgr.ts';
import type * as MsgBuilder from '../../message/index.ts';
import type * as Log from '../../types.ts';
import type * as cli from './types.ts';

export const getLogger = <M extends MsgBuilder.IBasic>(
  log: LogMgr<M> | Logger.IEmitter,
  opts: Log.GetChildOpts = {},
): CliLogger<M> => {
  if (log instanceof LogMgr) {
    return new CliLogger<M>(log).setReqId(opts.reqId).setPackage(opts.pkg);
  } else if (log instanceof CliLogger) {
    return log.getChild(opts) as CliLogger<M>;
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
  constructor(logMgr: LogMgr<M>) {
    super(logMgr);
  }

  override copy(): CliLogger<M> {
    const result = new CliLogger<M>(this._logMgr);
    result.assign(this);
    return result;
  }

  override emit(msg: Log.Entry): void {
    if (this.meetsThreshold(msg.level)) {
      console.log(msg.msg);
    }
  }

  // /**
  //  * Helper to create a new MsgBuilder instance using the registered builder class.
  //  * @param level A string representing the log level.
  //  * @returns An instance of the MsgBuilder.
  //  */
  // private getBuilderInstance(level: string): M {
  //   // getMsgBuilderClass() should return a constructor of the form:
  //   // new (level: string, logger: Logger<M>) => M
  //   const BuilderClass = this._logMgr.getMsgBuilderClass();
  //   return new BuilderClass(level, this);
  // }

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
