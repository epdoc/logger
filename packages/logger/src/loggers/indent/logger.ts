import type * as Log from '$log';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { isArray, isNumber, isString } from '@epdoc/type';
import * as Base from '../base/mod.ts';

/**
 * Extends the {@link AbstractLogger} logger to provide indentation capabilities for log output.
 *
 * @remarks
 * This class allows for structured, hierarchical logging by prepending custom
 * indentation strings to log messages. It is particularly useful for visualizing
 * nested operations or code blocks in console output.
 *
 * @template M - The type of message builder used by the logger, conforming to
 * {@link MsgBuilder.Base.Builder}.
 * @implements {Logger.IIndent}
 */
export class IndentLogger<M extends MsgBuilder.Abstract> extends Base.Logger<M> {
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
   * Creates a message builder with indentation applied.
   * This method wraps the LogMgr's getMsgBuilder to apply indentation.
   * @internal
   */
  protected getIndentedMsgBuilder(level: string): M {
    const msgBuilder = this._logMgr.getMsgBuilder(level, this);

    // Apply indentation if present
    if (this._indent.length > 0) {
      const indentPrefix = this._indent.join(' ');
      if (msgBuilder && typeof msgBuilder === 'object' && 'prependMsgPart' in msgBuilder) {
        (msgBuilder as unknown as { prependMsgPart: (str: string) => void }).prependMsgPart(indentPrefix);
      }
    }

    return msgBuilder;
  }

  /**
   * Emits a log entry, applying indentation for direct emit calls.
   * @param {Log.Entry} msg - The log entry to emit.
   */
  override emit(msg: Log.Entry): void {
    if (this.meetsThreshold(msg.level) && msg.msg) {
      // Apply indentation for direct emit calls
      if (this._indent.length > 0) {
        const indentPrefix = this._indent.join(' ');
        if (typeof msg.msg === 'string') {
          msg.msg = indentPrefix + msg.msg;
        } else if (msg.msg && typeof msg.msg === 'object' && 'prependMsgPart' in msg.msg) {
          (msg.msg as unknown as { prependMsgPart: (str: string) => void }).prependMsgPart(indentPrefix);
        }
      }
      this._logMgr.emit(msg);
    }
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
