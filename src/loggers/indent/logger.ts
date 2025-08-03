import { isArray, isNumber, isString } from '@epdoc/type';
import * as MsgBuilder from '../../message/mod.ts';
import type * as Log from '../../types.ts';
import * as Base from '../base/mod.ts';
import type { IIndentLogger } from './types.ts';

/**
 * Extends the {@link AbstractLogger} logger to provide indentation capabilities for log output.
 *
 * @remarks
 * This class allows for structured, hierarchical logging by prepending custom
 * indentation strings to log messages. It is particularly useful for visualizing
 * nested operations or code blocks in console output.
 *
 * @template M - The type of message builder used by the logger, conforming to
 * {@link MsgBuilder.IBasic}.
 * @implements {Logger.IIndent}
 */
export class IndentLogger<M extends MsgBuilder.Base.Builder> extends Base.Logger<M> implements IIndentLogger {
  /**
   * The start time for time-based logging operations.
   * @protected
   */
  protected _t0: Date = new Date();
  /**
   * An array of strings representing the current indentation levels.
   * Each string in the array is prepended to the log message.
   * @protected
   */
  protected _indent: string[] = [];

  /**
   * Sets the start time for the logger's internal time tracking.
   *
   * @remarks
   * This method is typically used to override the default creation time of the
   * logger instance. Child loggers created via `getChild` will inherit their
   * parent's start time.
   *
   * @param {Date} d - The date to set as the start time.
   * @returns {this} The current logger instance for chaining.
   */
  startTime(d: Date): this {
    this._t0 = d;
    return this;
  }

  /**
   * Assigns properties from another `Indent` logger to this instance.
   * @internal
   */
  override assign(logger: IndentLogger<M>): void {
    super.assign(logger);
    this._t0 = logger._t0;
    this._indent = [...logger._indent];
  }

  /**
   * Emits a log entry, applying the current indentation to the message.
   *
   * @remarks
   * This method overrides the base `emit` to prepend the accumulated indentation
   * strings to the log message before passing it to the `LogMgr`'s transport
   * manager. This ensures that all messages emitted by this logger (or its
   * children) are properly indented.
   *
   * @param {Log.Entry} msg - The log entry to emit.
   */
  override emit(msg: Log.Entry): void {
    if (isString(msg.msg)) {
      msg.msg = [...this._indent, msg.msg].join(' ');
    } else if (msg.msg instanceof MsgBuilder.Base.Builder) {
      // Iterate in reverse to prepend indents in the correct order
      for (let i = this._indent.length - 1; i >= 0; i--) {
        const indent = this._indent[i];
        if (msg.msg instanceof MsgBuilder.Base.Builder) {
          msg.msg.prependMsgPart(indent);
        }
      }
    }
    // Hand off emitting to LogMgr, which will direct to all transports
    // The parent Base class's emit method calls this._logMgr.emit(msg)
    // This override calls _logMgr.transportMgr.emit(msg) directly.
    // It seems the intention is to bypass the LogMgr's own emit logic here.
    // If this is not the case, consider calling super.emit(msg)
    // or this._logMgr.emit(msg) for consistency.
    this._logMgr.transportMgr.emit(msg);
  }

  /**
   * Adds one or more levels of indentation to the logger's output.
   *
   * @remarks
   * - If `n` is a `string`, it is added directly as an indentation string.
   * - If `n` is a `number`, that many spaces are added as indentation levels.
   * - If `n` is an `array` of strings, each string is added as an indentation level.
   * - If `n` is `undefined`, a single space is added as an indentation level.
   *
   * @param {number | string | string[]} [n] - The indentation value(s) to add.
   * @returns {this} The current logger instance for chaining.
   */
  indent(n?: number | string | string[]): this {
    if (isString(n)) {
      this._indent.push(n);
    } else if (isNumber(n)) {
      for (let x = 0; x < n; ++x) {
        this._indent.push(' ');
      }
    } else if (isArray(n)) {
      for (let x = 0; x < n.length; ++x) {
        this._indent.push(n[x]);
      }
    } else {
      this._indent.push(' ');
    }
    return this;
  }

  /**
   * Retrieves the current array of indentation strings.
   * @internal
   */
  getdent(): string[] {
    return this._indent;
  }

  /**
   * Removes one or more levels of indentation.
   *
   * @param {number} [n=1] - The number of indentation levels to remove.
   * @returns {this} The current logger instance for chaining.
   */
  outdent(n: number = 1): this {
    for (let x = 0; x < n; ++x) {
      if (this._indent.length > 0) {
        this._indent.pop();
      }
    }
    return this;
  }

  /**
   * Resets all indentation levels, effectively removing all current indentation.
   *
   * @remarks
   * This method is useful for ensuring that subsequent log messages start at
   * the very beginning of the line, regardless of previous indentation.
   *
   * @returns {this} The current logger instance for chaining.
   */
  nodent(): this {
    this._indent = [];
    return this;
  }
}
