import type { LogMgr } from '../../logmgr.ts';
import type * as MsgBuilder from '$msgbuilder';
import * as Indent from '../indent/mod.ts';

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
export class BareLogger<M extends MsgBuilder.Base.Builder> extends Indent.Logger<M> {
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
}
