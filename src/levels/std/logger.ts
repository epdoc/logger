import * as Logger from '../../logger/index.ts';
import { LogMgr } from '../../logmgr.ts';
import type * as MsgBuilder from '../../message/index.ts';
import type * as Log from '../../types.ts';
import type * as std from './types.ts';

export const getLogger = <M extends MsgBuilder.IBasic>(
  log: LogMgr<M> | Logger.IEmitter,
  opts: Log.GetChildOpts = {},
): StdLogger<M> => {
  if (log instanceof LogMgr) {
    return new StdLogger<M>(log).setReqId(opts.reqId).setPackage(opts.pkg);
  } else if (log instanceof StdLogger) {
    return log.getChild(opts) as StdLogger<M>;
  }
  throw new Error('Invalid logger type');
};

/**
 * Logger that implements STD levels. These levels are:
 *  - error
 *  - warn
 *  - info
 *  - debug
 *  - verbose
 *  - trace
 *  - spam (* bonus level not normlly part of STD)
 */

export class StdLogger<M extends MsgBuilder.IBasic> extends Logger.Indent<M> implements std.ILogger<M> {
  override copy(): StdLogger<M> {
    const result = new StdLogger<M>(this._logMgr);
    result.assign(this);
    return result;
  }

  /**
   * An error message indicates a serious problem in the system. The problem is
   * usually non-recoverable and requires manual intervention.
   * @returns A message builder for the ERROR level.
   */
  get error(): M {
    return this._logMgr.getMsgBuilder('ERROR', this);
    // return this._logMgr.getMessageBuilder('ERROR');
  }

  /**
   * A warning message indicates a potential problem in the system. the System
   * is able to handle the problem by themself or to proccede with this problem
   * anyway.
   * @returns A message builder for the WARN level.
   */
  get warn(): M {
    return this._logMgr.getMsgBuilder('WARN', this);
  }

  /**
   * Info messages contain some contextual information to help trace execution
   * (at a coarse-grained level) in a production environment. For user-facing
   * applications, these are messages that the user is meant to see.
   * @returns A message builder for the INFO level.
   */
  get info(): M {
    return this._logMgr.getMsgBuilder('INFO', this);
  }

  /**
   * A verbose message is also aimed at users, but contains more granular
   * information than an info message. Info messages tend to summarize progress,
   * while verbose messages spill all the details.
   * @returns A message builder for the VERBOSE level.
   */
  get verbose(): M {
    return this._logMgr.getMsgBuilder('VERBOSE', this);
  }

  /**
   * Messages in this level  are mostly used for problem diagnosis. Information
   * on this Level are for Developers and not for the Users. This is an
   * appropriate level to dump stack trace information, where it exists.
   * @returns A message builder for the DEBUG level.
   */
  get debug(): M {
    return this._logMgr.getMsgBuilder('DEBUG', this);
  }

  /**
   * A trace message is for developers to trace execution of the program,
   * usually to help during development.
   * @returns A message builder for the TRACE level.
   */
  get trace(): M {
    return this._logMgr.getMsgBuilder('TRACE', this);
  }

  /**
   * A spam message is for developers to display log messages that would
   * normally be commented out.
   * @returns A message builder for the SPAM level.
   */
  get spam(): M {
    return this._logMgr.getMsgBuilder('SPAM', this);
  }
}
