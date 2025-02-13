import { type Integer, isDict, isInteger, isNonEmptyArray, isNonEmptyString } from '@epdoc/type';
import { assert } from '@std/assert';
import type { Level } from '../levels/index.ts';
import type * as Logger from '../logger/types.ts';
import type * as Log from '../types.ts';
import { StringUtil } from '../util.ts';
import type * as MsgBuilder from './types.ts';

const DEFAULT_TAB_SIZE = 2;

/**
 * A LoggerLine is a line of output from a Logger. It is used to build up a log
 * line, add styling, and emit the log line.
 */
export class Basic implements MsgBuilder.IBasic {
  protected _timestamp: Date = new Date();
  protected _level: Level.Name;
  protected _emitter: Logger.IEmitter | undefined;
  protected _tabSize: Integer = DEFAULT_TAB_SIZE;
  // protected _lineFormat: LoggerLineFormatOpts;
  protected _applyColors: boolean = true;

  protected _msgIndent: string = '';
  protected _msgParts: Log.MsgPart[] = [];
  protected _data: Record<string, unknown> | undefined;
  protected _suffix: string[] = [];
  // protected _level: LogLevelValue = logLevel.info;
  protected _showElapsed: boolean = false;

  constructor(level: Level.Name, emitter?: Logger.IEmitter) {
    this._level = level;
    this._emitter = emitter;
  }

  static factoryMethod(level: Level.Name, emitter?: Logger.IEmitter): Basic {
    return new Basic(level, emitter);
  }

  set level(level: Level.Name) {
    this._level = level;
  }

  set emitter(emitter: Logger.IEmitter) {
    this._emitter = emitter;
  }

  get emitter(): Logger.IEmitter {
    assert(this._emitter, 'No logger set');
    return this._emitter;
  }

  meetsThreshold(level: Level.Value | Level.Name, threshold: Level.Value | Level.Name): boolean {
    return this.emitter.meetsThreshold(level, threshold);
  }

  applyColors(): this {
    this._applyColors = true;
    return this;
  }

  noColors(): this {
    this._applyColors = false;
    return this;
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

  setInitialString(...args: Log.StyleArg[]): this {
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
      this.addMsgPart(' '.repeat(n - 1));
    } else if (isNonEmptyString(n)) {
      this.addMsgPart(n);
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

  protected addMsgPart(str: string, style?: Log.StyleFormatterFn | null): this {
    // const _style = this.stylizeEnabled ? style : undefined;
    const part: Log.MsgPart = { str: str };
    if (style) {
      part.style = style;
    }
    this._msgParts.push(part);
    return this;
  }

  protected appendMsg(...args: unknown[]): this {
    if (isNonEmptyArray(args)) {
      this.addMsgPart(args.join(' '));
    }
    return this;
  }

  protected appendSuffix(...args: string[]): this {
    this._suffix.push(args.join(' '));
    return this;
  }

  stylize(style: Log.StyleFormatterFn | null, ...args: Log.StyleArg[]): this {
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
      this.addMsgPart(str, style);
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
    if (isDict(data)) {
      if (!this._data) {
        this._data = data;
      } else {
        this._data = Object.assign(this._data, data);
      }
    }
    return this;
  }

  /**
   * Emits the log line.
   * @param { unknown[]} args - The arguments to emit.
   * @returns {void}
   * @see ewt()
   * @see emitWithTime()
   */
  emit(...args: unknown[]): Log.Entry {
    this.appendMsg(...args);
    const msg: Log.Entry = {
      timestamp: this._timestamp,
      level: this._level,
      msg: this.formatParts(),
      package: this.emitter.package,
    };
    if (this._data) {
      msg.data = this._data;
    }
    this.clear();
    if (this._emitter) {
      this._emitter.emit(msg);
    }
    return msg;
  }

  partsAsString(): string {
    return this._msgParts?.map((p) => p.str).join(' ') || '';
  }

  protected formatParts(): string {
    const parts: string[] = [];
    if (isNonEmptyString(this._msgIndent)) {
      parts.push(this._msgIndent);
    }
    this._msgParts.forEach((part: Log.MsgPart) => {
      if (part.style && this._applyColors) {
        parts.push(part.style(part.str));
      } else {
        parts.push(part.str);
      }
    });
    return parts.join(' ');
  }
}
