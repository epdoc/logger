import { type Integer, isDict, isInteger, isNonEmptyArray, isNonEmptyString } from '@epdoc/type';
import type { Level } from '../levels/index.ts';
import * as Transport from '../transports/types.ts';
import type * as Log from '../types.ts';
import { StringUtil } from '../util.ts';
import type * as MsgBuilder from './index.ts';

const DEFAULT_TAB_SIZE = 2;

/**
 * A LoggerLine is a line of output from a Logger. It is used to build up a log
 * line, add styling, and emit the log line.
 */
export class Base implements MsgBuilder.IBasic, MsgBuilder.IFormat {
  protected _timestamp: Date = new Date();
  protected _level: Level.Name;
  protected _emitter: Log.IEmitter | undefined;
  protected _params: Log.IParams;
  protected _meetsThreshold: boolean = true;
  protected _tabSize: Integer = DEFAULT_TAB_SIZE;

  protected _msgIndent: string = '';
  protected _msgParts: MsgBuilder.MsgPart[] = [];
  protected _data: Record<string, unknown> | undefined;
  protected _suffix: string[] = [];
  // protected _level: LogLevelValue = logLevel.info;
  protected _showElapsed: boolean = false;

  constructor(
    level: Level.Name,
    params: Log.IParams,
    emitter?: Log.IEmitter,
    meetsThreshold: boolean = true,
  ) {
    this._level = level;
    this._params = params;
    this._emitter = emitter;
    this._meetsThreshold = meetsThreshold;
  }

  static factoryMethod(
    level: Level.Name,
    params: Log.IParams,
    emitter?: Log.IEmitter,
    meetsThreshold: boolean = true,
  ): Base {
    return new Base(level, params, emitter, meetsThreshold);
  }

  set level(level: Level.Name) {
    this._level = level;
  }

  /**
   * Clears the current line, essentially resetting the output line. This does
   * not clear the reqId, sid or emitter values.
   * @returns {this} The LoggerLine instance.
   */
  clear(): this {
    this._msgParts = [];
    this._data = undefined;
    return this;
  }

  setInitialString(...args: MsgBuilder.StyleArg[]): this {
    if (args.length) {
      const count = new StringUtil(args[0]).countTabsAtBeginningOfString();
      if (count) {
        this.tab(count);
        args[0] = String(args[0]).slice(count);
      }
    }
    return this.stylize(null, ...args);
  }

  indent(n: Integer | string = DEFAULT_TAB_SIZE): this {
    if (isInteger(n)) {
      this.appendMsgPart(' '.repeat(n - 1));
    } else if (isNonEmptyString(n)) {
      this.appendMsgPart(n);
    }
    return this;
  }

  /**
   * Sets the indentation level of this line of log output..
   * @param {Integer} n - The number of tabs by which to indent.
   * @returns {this} The Logger instance.
   */
  tab(n: Integer = 1): this {
    this._msgIndent = ' '.repeat(n * this._tabSize - 1);
    return this;
  }

  /**
   * Adds a comment to the end of the log line.
   * @param { unknown} args - The arguments to add.
   * @returns {this} The Logger instance.
   */
  comment(...args: string[]): this {
    this.appendSuffix(...args);
    return this;
  }

  appendMsgPart(str: string, style?: MsgBuilder.StyleFormatterFn | null): this {
    const part: MsgBuilder.MsgPart = { str: str }; // Updated to use MsgBuilder.MsgPart
    if (style) {
      part.style = style;
    }
    this._msgParts.push(part);
    return this;
  }

  prependMsgPart(str: string, style?: MsgBuilder.StyleFormatterFn | null): this {
    const part: MsgBuilder.MsgPart = { str: str }; // Updated to use MsgBuilder.MsgPart
    if (style) {
      part.style = style;
    }
    this._msgParts.unshift(part);
    return this;
  }

  protected appendMsg(...args: unknown[]): this {
    if (isNonEmptyArray(args)) {
      this.appendMsgPart(args.join(' '));
    }
    return this;
  }

  protected appendSuffix(...args: string[]): this {
    this._suffix.push(args.join(' '));
    return this;
  }

  stylize(style: MsgBuilder.StyleFormatterFn | null, ...args: MsgBuilder.StyleArg[]): this {
    if (isNonEmptyArray(args)) {
      const str = args
        .map((arg) => {
          if (isNonEmptyString(arg)) {
            return arg;
          } else if (isDict(arg) || isNonEmptyArray(arg)) {
            return JSON.stringify(arg);
          }
          return String(arg);
        })
        .join(' ');
      this.appendMsgPart(str, style);
    }
    return this;
  }

  /**
   * Adds plain text to the log line.
   * @param { unknown} args - The arguments to add.
   * @returns {this} The Logger instance.
   */
  plain(...args: unknown[]): this {
    return this.appendMsg(...args);
  }

  data(data: Record<string, unknown>): this {
    if (isDict(data) && this._meetsThreshold) {
      if (!this._data) {
        this._data = data;
      } else {
        this._data = Object.assign(this._data, data);
      }
    }
    return this;
  }

  /**
   * Emits the log line, and also returns the object that will have been
   * emitted.
   * @param { unknown[]} args - Optional additional arguments to emit as unformatted text.
   * @returns {void}
   * @see ewt()
   * @see emitWithTime()
   */
  emit(...args: unknown[]): Log.Entry | undefined {
    if (this._meetsThreshold) {
      this.appendMsg(...args);
      const entry: Log.Entry = {
        timestamp: this._timestamp,
        level: this._level,
        data: this._data,
        sid: this._params.sid,
        msg: this,
      };
      if (this._params.reqIds.length) {
        entry.reqId = this._params.reqIds.join('.');
      }
      if (this._params.pkgs.length) {
        entry.package = this._params.pkgs.join('.');
      }
      if (this._emitter) {
        this._emitter.emit(entry);
      }
      this.clear();
      return entry;
    }
  }

  partsAsString(): string {
    return this._msgParts?.map((p) => p.str).join(' ') || '';
  }

  format(color: boolean, _target: Transport.OutputFormat = Transport.Format.text): string {
    const parts: string[] = [];
    if (isNonEmptyString(this._msgIndent)) {
      parts.push(this._msgIndent);
    }
    this._msgParts.forEach((part: MsgBuilder.MsgPart) => {
      if (part.style && color) {
        parts.push(part.style(part.str));
      } else {
        parts.push(part.str);
      }
    });
    return parts.join(' ');
  }
}
