import { Indent as LoggerIndent } from '../../logger/indent.ts';
import type * as Logger from '../../logger/types.ts';
import { LogMgr } from '../../logmgr.ts';
import type { IBasic as MsgBuilderIBasic } from '../../message/types.ts';
import type * as std from './types.ts';

/**
 * Factory method to obtain a standard logger instance.
 *
 * @remarks
 * This function serves as the primary way to get a `StdLogger`. It can either
 * create a new root logger if a `LogMgr` is provided, or return a child logger
 * if an existing `StdLogger` instance is passed.
 *
 * @template M - The type of message builder used by the logger.
 * @param {LogMgr<M> | Logger.IEmitter} log - The log manager or an existing logger instance.
 * @param {Logger.IGetChildParams} [params] - Optional parameters for creating a child logger.
 * @returns {StdLogger<M>} A new or child `StdLogger` instance.
 * @throws {Error} If an invalid logger type is provided.
 */
export const createStdLogger = <M extends MsgBuilderIBasic>(
  log: LogMgr<M> | Logger.IEmitter,
  params?: Logger.IGetChildParams,
): StdLogger<M> => {
  if (log instanceof LogMgr) {
    return new StdLogger<M>(log, params);
  } else if (log instanceof StdLogger) {
    return log.getChild(params) as StdLogger<M>;
  }
  throw new Error('Invalid logger type');
};

/**
 * Implements a logger with a standard set of log levels.
 *
 * @remarks
 * This logger provides the following common log levels:
 * - `error`: For critical, usually non-recoverable issues.
 * - `warn`: For potential problems that don't halt execution.
 * - `info`: For general informational messages.
 * - `verbose`: For more detailed information than `info`, often for debugging.
 * - `debug`: For detailed diagnostic information, typically for developers.
 * - `trace`: For fine-grained tracing of program execution.
 * - `spam`: An additional level for very verbose, often temporary, debugging output.
 *
 * This class extends {@link Logger.Indent} to provide indentation capabilities
 * and implements {@link std.IStdLogger} and {@link Logger.IEmitter} for its core
 * logging functionality.
 *
 * @template M - The type of message builder used by the logger.
 */
export class StdLogger<M extends MsgBuilderIBasic> extends LoggerIndent<M>
  implements std.IStdLogger<M>, Logger.IEmitter {
  /**
   * Creates a shallow copy of the current `StdLogger` instance.
   * @returns {this} A new `StdLogger` instance with copied properties.
   * @internal
   */
  override copy(): this {
    const result = new (this.constructor as new (logMgr: LogMgr<M>) => this)(this._logMgr);
    result.assign(this);
    return result;
  }

  /**
   * Provides a message builder for the `ERROR` log level.
   *
   * @remarks
   * Use this level for severe errors that indicate a critical failure and may
   * require immediate attention or manual intervention.
   *
   * @returns {M} A message builder configured for the `ERROR` level.
   */
  public get error(): M {
    return this._logMgr.getMsgBuilder('ERROR', this);
  }

  /**
   * Provides a message builder for the `WARN` log level.
   *
   * @remarks
   * Use this level for potential issues or unexpected events that do not
   * prevent the application from continuing but might indicate a problem.
   *
   * @returns {M} A message builder configured for the `WARN` level.
   */
  public get warn(): M {
    return this._logMgr.getMsgBuilder('WARN', this);
  }

  /**
   * Provides a message builder for the `INFO` log level.
   *
   * @remarks
   * Use this level for general operational messages that provide high-level
   * insight into the application's flow. These are typically user-facing.
   *
   * @returns {M} A message builder configured for the `INFO` level.
   */
  public get info(): M {
    return this._logMgr.getMsgBuilder('INFO', this);
  }

  /**
   * Provides a message builder for the `VERBOSE` log level.
   *
   * @remarks
   * Use this level for more detailed informational messages than `INFO`,
   * often useful for understanding the steps within a process.
   *
   * @returns {M} A message builder configured for the `VERBOSE` level.
   */
  public get verbose(): M {
    return this._logMgr.getMsgBuilder('VERBOSE', this);
  }

  /**
   * Provides a message builder for the `DEBUG` log level.
   *
   * @remarks
   * Use this level for detailed diagnostic information, typically intended
   * for developers during debugging. May include variable values or internal states.
   *
   * @returns {M} A message builder configured for the `DEBUG` level.
   */
  public get debug(): M {
    return this._logMgr.getMsgBuilder('DEBUG', this);
  }

  /**
   * Provides a message builder for the `TRACE` log level.
   *
   * @remarks
   * Use this level for fine-grained tracing of program execution, often used
   * to follow the path of execution through complex logic or function calls.
   *
   * @returns {M} A message builder configured for the `TRACE` level.
   */
  public get trace(): M {
    return this._logMgr.getMsgBuilder('TRACE', this);
  }

  /**
   * Provides a message builder for the `SPAM` log level.
   *
   * @remarks
   * This is an extra verbose level, typically used for very frequent or noisy
   * debugging output that would normally be commented out in production code.
   *
   * @returns {M} A message builder configured for the `SPAM` level.
   */
  public get spam(): M {
    return this._logMgr.getMsgBuilder('SPAM', this);
  }
}
