import type * as Log from '$log';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { type Integer, isArray, isInteger, isPosInteger, isString } from '@epdoc/type';
import { DateTime } from '@epdoc/datetime';
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
  protected _t0: DateTime = DateTime.now();
  /**
   * An array of strings representing the current indentation levels.
   * Each string in the array is prepended to the log message.
   * @protected
   */
  protected _indent: string[] = [];
  protected override _msgSep: Integer | undefined = undefined;

  /**
   * Sets the message separator (number of spaces between message parts).
   * Set to `undefined` to reset to the default from `show.msgSep`.
   * @param {Integer | undefined} val - The number of spaces, or undefined to use the default.
   */
  override set msgSep(val: Integer | undefined) {
    this._msgSep = val;
  }

  /**
   * Retrieves the message separator value, or `undefined` if using the default.
   */
  override get msgSep(): Integer | undefined {
    return this._msgSep;
  }

  /**
   * Sets the start time for the logger's internal time tracking.
   *
   * @remarks
   * This method is typically used to override the default creation time of the
   * logger instance. Child loggers created via `getChild` will inherit their
   * parent's start time.
   *
   * @param {DateTime} d - The date to set as the start time.
   * @returns {this} The current logger instance for chaining.
   */
  startTime(d: DateTime): this {
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
    if (msg.msg && this._logMgr.transportMgr.meetsAnyThreshold(msg.level)) {
      // Apply indentation for direct emit calls
      if (this._indent.length > 0) {
        const indentPrefix = this._indent.join(' ');
        if (typeof msg.msg === 'string') {
          msg.msg = indentPrefix + msg.msg;
        } else if (msg.msg && typeof msg.msg === 'object' && 'prependMsgPart' in msg.msg) {
          (msg.msg as unknown as { prependMsgPart: (str: string) => void }).prependMsgPart(indentPrefix);
        }
      }
      this._logMgr.transportMgr.emit(msg);
    }
  }

  /**
   * Adds one or more levels of indentation to the logger's output.
   *
   * @remarks
   * - If `n` is a `string`, it is added directly as an indentation string.
   * - If `n` is a `number`, that many spaces are added or removed as indentation levels.
   * - If `n` is an `array` of strings, each string is added as an indentation level.
   * - If `n` is `undefined`, a single space is added as an indentation level.
   * - If `n` is `false`, indenting is turned off (same as nodent)
   *
   * Automatically suppressed when progress is active (between start/stop) to prevent
   * interfering with progress indicator display.
   *
   * @param {number | string | string[] | false} [n] - The indentation value(s) to add.
   * @returns {this} The current logger instance for chaining.
   *
   * @example
   * ```typescript
   * // Regular indent - always applies
   * logger.indent();
   * logger.indent(2);
   * logger.indent('  ');
   *
   * // Indent automatically suppressed during progress
   * logger.info.text('Building').start();
   * logger.indent();  // No-op - progress is active
   * logger.info.text('Done').stop();
   * ```
   */
  indent(n?: number | string | string[] | false): this {
    // Skip indent if progress is active to avoid disrupting progress display
    if (this._logMgr.transportMgr.hasActiveProgress) {
      return this;
    }

    if (n === false) {
      this._indent = [];
    } else if (isString(n)) {
      this._indent.push(n);
    } else if (isPosInteger(n)) {
      for (let x = 0; x < n; ++x) {
        this._indent.push(' ');
      }
    } else if (isInteger(n)) {
      // n is negative, remove |n| indent levels
      const levelsToRemove = Math.abs(n);
      for (let x = 0; x < levelsToRemove && this._indent.length > 0; ++x) {
        this._indent.pop();
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
   *
   * Automatically suppressed when progress is active (between start/stop) to prevent
   * interfering with progress indicator display.
   *
   * @example
   * ```typescript
   * // Regular outdent - always applies
   * logger.outdent();
   * logger.outdent(2);
   *
   * // Outdent automatically suppressed during progress
   * logger.info.text('Building').start();
   * logger.outdent();  // No-op - progress is active
   * logger.info.text('Done').stop();
   * ```
   */
  outdent(n: number = 1): this {
    // Skip outdent if progress is active to avoid disrupting progress display
    if (this._logMgr.transportMgr.hasActiveProgress) {
      return this;
    }

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

  /**
   * Sets the number of spaces between message parts for subsequent log messages.
   * Call with no argument to reset to the default from `show.msgSep`.
   * @param {Integer} [n] - The number of spaces, or omit to reset to the default.
   * @returns {this} The logger instance for chaining.
   */
  sep(n?: Integer): this {
    this.msgSep = n;
    return this;
  }
}
