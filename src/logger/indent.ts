import { isArray, isNumber, isString } from '@epdoc/type';
import * as MsgBuilder from '../message/index.ts';
import type * as Log from '../types.ts';
import { Base } from './base.ts';
import type * as Logger from './types.ts';

/**
 * A logger class that provides indentation functionality. It extends the `Base`
 * logger and implements the `IIndent` interface, which allows for indented
 * lines of logger output.
 *
 * @template M - Type extending `MsgBuilder.IBasic` for message building.
 * @implements {Logger.IIndent}
 */
export class Indent<M extends MsgBuilder.IBasic> extends Base<M> implements Logger.IIndent {
  /**
   * The start time for time-based logging operations.
   * @protected
   */
  protected _t0: Date = new Date();
  /**
   * An array of strings representing the current indentation levels. We use
   * strings for more flexibility, but usually an array of spaces is used.
   * @protected
   */
  protected _indent: string[] = [];

  /**
   * Sets the start time for the logger. This is only needed if the creation
   * time of `this` object needs to be overridden. Note that any getChild methods
   * will inherit the start time of their parent.
   * @param d - The date to set as the start time.
   * @returns The current logger instance.
   */
  startTime(d: Date): this {
    this._t0 = d;
    return this;
  }

  /**
   * Assigns properties from another `Indent` logger to this instance. This is
   * for internal use.
   * @param logger - The source `Indent` logger to copy properties from.
   */
  override assign(logger: Indent<M>): void {
    super.assign(logger);
    this._t0 = logger._t0;
    this._indent = [...logger._indent];
  }

  /**
   * Emits a log entry, prepending the current indentation to the message.
   * @param msg - The log entry to emit.
   */
  override emit(msg: Log.Entry): void {
    if (isString(msg.msg)) {
      msg.msg = [...this._indent, msg.msg].join(' ');
    } else if (msg.msg instanceof MsgBuilder.Base) {
      // Iterate in reverse to prepend indents in the correct order
      for (let i = this._indent.length - 1; i >= 0; i--) {
        const indent = this._indent[i];
        if (msg.msg instanceof MsgBuilder.Base) {
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
   * Adds indentation to the logger. Note that indents are separated by spaces,
   * so setting `n` to a single space will indent log messages by 2 spaces. If
   * `n` is a string, it's added as a custom indent string. If `n` is a number,
   * that many spaces are added. If `n` is an array of strings, each string is
   * added as an indent level. If `n` is undefined, a single space is added.
   * @param n - The indentation value (string, number, array of strings, or
   * undefined).
   * @returns The current logger instance.
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
   * Gets the current array of indentation strings. This is for internal use.
   * @returns An array of strings representing the current indentation.
   */
  getdent(): string[] {
    return this._indent;
  }

  /**
   * Removes indentation levels.
   * @param n - The number of indentation levels to remove (default is 1).
   * @returns The current logger instance.
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
   * Resets all indentation levels. It is more typical for the `outdent` method
   * to be paired with a call to an `indent` method.
   * @returns The current logger instance.
   */
  nodent(): this {
    this._indent = [];
    return this;
  }
}
