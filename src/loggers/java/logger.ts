import type { LogMgr } from '../../logmgr.ts';
import type * as MsgBuilder from '../../message/mod.ts';
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
export class JavaLogger<M extends MsgBuilder.Base.Builder> extends Indent.Logger<M> {
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
  public get severe(): M {
    return this._logMgr.getMsgBuilder('SEVERE', this);
  }

  public get warning(): M {
    return this._logMgr.getMsgBuilder('WARNING', this);
  }

  public get info(): M {
    return this._logMgr.getMsgBuilder('INFO', this);
  }

  public get config(): M {
    return this._logMgr.getMsgBuilder('CONFIG', this);
  }

  public get fine(): M {
    return this._logMgr.getMsgBuilder('FINE', this);
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
  public get finer(): M {
    return this._logMgr.getMsgBuilder('FINER', this);
  }
  public get finest(): M {
    return this._logMgr.getMsgBuilder('FINEST', this);
  }
}
