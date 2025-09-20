import type * as MsgBuilder from '$msgbuilder';
import type { LogMgr } from '../../logmgr.ts';
import * as Min from '../min/mod.ts';
import type * as Logger from '../types.ts';

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
export class StdLogger<M extends MsgBuilder.Base.Builder> extends Min.Logger<M> implements Logger.IEmitter {
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
   * Provides a message builder for the `FATAL` log level.
   *
   * @remarks
   * Use this level for severe errors that indicate a critical failure and may
   * require immediate attention or manual intervention.
   *
   * @returns {M} A message builder configured for the `ERROR` level.
   */
  public get fatal(): M {
    return this._logMgr.getMsgBuilder('FATAL', this);
  }

  /**
   * Provides a message builder for the `FATAL` log level.
   *
   * @remarks
   * Use this level for severe errors that indicate a critical failure and may
   * require immediate attention or manual intervention.
   *
   * @returns {M} A message builder configured for the `ERROR` level.
   */
  public get critical(): M {
    return this._logMgr.getMsgBuilder('CRITICAL', this);
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
  public get silly(): M {
    return this._logMgr.getMsgBuilder('SILLY', this);
  }
}
