import * as CoreLogger from '../../logger/index.ts';
import { LogMgr } from '../../logmgr.ts';
import * as MsgBuilder from '../../message/index.ts';
import type * as Log from '../../types.ts';
import type * as std from './types.ts';

export const getLogger: CoreLogger.FactoryMethod = (
  log: LogMgr | CoreLogger.IEmitter,
  opts: Log.GetChildOpts = {},
) => {
  if (log instanceof LogMgr) {
    return new Logger(log).setReqId(opts.reqId).setPackage(opts.pkg);
  } else if (log instanceof Logger) {
    return log.getChild(opts);
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

export class Logger extends CoreLogger.Indent implements std.ILogger {
  override copy(): Logger {
    const result = new Logger(this._logMgr);
    result.assign(this);
    return result;
  }

  /**
   * An error message indicates a serious problem in the system. The problem is
   * usually non-recoverable and requires manual intervention.
   * @returns A message builder for the ERROR level.
   */
  get error(): MsgBuilder.Console {
    return new MsgBuilder.Console('ERROR', this);
  }

  /**
   * A warning message indicates a potential problem in the system. the System
   * is able to handle the problem by themself or to proccede with this problem
   * anyway.
   * @returns A message builder for the WARN level.
   */
  get warn(): MsgBuilder.Console {
    return new MsgBuilder.Console('WARN', this);
  }

  /**
   * Info messages contain some contextual information to help trace execution
   * (at a coarse-grained level) in a production environment. For user-facing
   * applications, these are messages that the user is meant to see.
   * @returns A message builder for the INFO level.
   */
  get info(): MsgBuilder.Console {
    return new MsgBuilder.Console('INFO', this);
  }

  /**
   * A verbose message is also aimed at users, but contains more granular
   * information than an info message. Info messages tend to summarize progress,
   * while verbose messages spill all the details.
   * @returns A message builder for the VERBOSE level.
   */
  get verbose(): MsgBuilder.Console {
    return new MsgBuilder.Console('VERBOSE', this);
  }

  /**
   * Messages in this level  are mostly used for problem diagnosis. Information
   * on this Level are for Developers and not for the Users. This is an
   * appropriate level to dump stack trace information, where it exists.
   * @returns A message builder for the DEBUG level.
   */
  get debug(): MsgBuilder.Console {
    return new MsgBuilder.Console('DEBUG', this);
  }

  /**
   * A trace message is for developers to trace execution of the program,
   * usually to help during development.
   * @returns A message builder for the TRACE level.
   */
  get trace(): MsgBuilder.Console {
    return new MsgBuilder.Console('TRACE', this);
  }

  /**
   * A spam message is for developers to display log messages that would
   * normally be commented out.
   * @returns A message builder for the SPAM level.
   */
  get spam(): MsgBuilder.Console {
    return new MsgBuilder.Console('SPAM', this);
  }
}
