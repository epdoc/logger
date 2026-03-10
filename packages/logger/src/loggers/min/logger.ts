import type * as MsgBuilder from '@epdoc/msgbuilder';
import type { LogMgr } from '../../logmgr.ts';
import * as Bare from '../bare/mod.ts';

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
export class MinLogger<M extends MsgBuilder.Abstract> extends Bare.Logger<M> {
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
    return this.getIndentedMsgBuilder('ERROR');
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
    return this.getIndentedMsgBuilder('DEBUG');
  }
}
