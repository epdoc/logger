import { type Integer, isDict, isInteger, isNonEmptyArray, isNonEmptyString } from '@epdoc/type';
import type { Level } from '../levels/index.ts';
import type * as Logger from '../logger/types.ts';
import * as Transport from '../transports/types.ts';
import type * as Log from '../types.ts';
import { StringUtil } from '../util.ts';
import type * as MsgBuilder from './index.ts';

const DEFAULT_TAB_SIZE = 2;

/**
 * The foundational message builder, responsible for constructing, styling, and
 * formatting a single log entry before it is emitted.
 *
 * @remarks
 * This class provides a chainable interface to build a log message piece by
 * piece. It manages message parts, indentation, and associated structured data.
 * Once fully constructed, the `emit` method forwards the completed log entry to
 * the associated {@link Logger.IEmitter}.
 *
 * It implements both {@link MsgBuilder.IBasic} for the core building logic and
 * {@link MsgBuilder.IFormat} for converting the message into a string.
 */
export class Base implements MsgBuilder.IBasic, MsgBuilder.IFormat {
  protected _timestamp: Date = new Date();
  protected _level: Level.Name;
  protected _emitter: Logger.IEmitter;
  protected _meetsThreshold: boolean = true;
  protected _meetsFlushThreshold: boolean = true;
  protected _tabSize: Integer = DEFAULT_TAB_SIZE;

  protected _msgIndent: string = '';
  protected _msgParts: MsgBuilder.MsgPart[] = [];
  protected _data: unknown | undefined;
  protected _suffix: string[] = [];
  protected _showElapsed: boolean = false;

  /**
   * Initializes a new message builder instance.
   *
   * @param {Level.Name} level - The log level of the message.
   * @param {Logger.IEmitter} emitter - The logger instance that will emit the final message.
   * @param {boolean} [meetsThreshold=true] - Whether the message meets the configured log level threshold.
   * @param {boolean} [meetsFlushThreshold=true] - Whether the message requires an immediate flush.
   */
  constructor(
    level: Level.Name,
    emitter: Logger.IEmitter,
    meetsThreshold = true,
    meetsFlushThreshold = true,
  ) {
    this._level = level;
    this._emitter = emitter;
    this._meetsThreshold = meetsThreshold;
    this._meetsFlushThreshold = meetsFlushThreshold;
  }

  /**
   * A factory method for creating new `Base` message builder instances.
   *
   * @remarks
   * This pattern is used by the {@link LogMgr} to decouple it from a specific
   * message builder implementation, allowing for greater flexibility.
   *
   * @param {Level.Name} level - The log level.
   * @param {Logger.IEmitter} emitter - The associated logger emitter.
   * @param {boolean} [meetsThreshold=true] - Whether the level meets the threshold.
   * @param {boolean} [meetsFlushThreshold=true] - Whether the level requires a flush.
   * @returns {Base} A new `Base` instance.
   */
  static factoryMethod(
    level: Level.Name,
    emitter: Logger.IEmitter,
    meetsThreshold = true,
    meetsFlushThreshold = true,
  ): Base {
    return new Base(level, emitter, meetsThreshold, meetsFlushThreshold);
  }

  /**
   * Sets the log level for the message.
   * @param {Level.Name} level - The log level name.
   */
  public set level(level: Level.Name) {
    this._level = level;
  }

  /**
   * Resets the message builder to its initial state, clearing all message parts and data.
   *
   * @returns {this} The current instance for chaining.
   */
  public clear(): this {
    this._msgParts = [];
    this._data = undefined;
    return this;
  }

  /**
   * Initializes the message with a string, automatically handling leading tabs for indentation.
   *
   * @param {MsgBuilder.StyleArg[]} args - The content to set as the initial message.
   * @returns {this} The current instance for chaining.
   */
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

  /**
   * Appends a specified number of spaces or a custom string for indentation.
   *
   * @param {Integer | string} [n=2] - The number of spaces or the string to use for indentation.
   * @returns {this} The current instance for chaining.
   */
  indent(n: Integer | string = DEFAULT_TAB_SIZE): this {
    if (isInteger(n)) {
      this.appendMsgPart(' '.repeat(n - 1));
    } else if (isNonEmptyString(n)) {
      this.appendMsgPart(n);
    }
    return this;
  }

  /**
   * Sets the indentation level based on tab counts.
   * @deprecated Use {@link indent} instead for more flexible indentation.
   */
  tab(n: Integer = 1): this {
    this._msgIndent = ' '.repeat(n * this._tabSize - 1);
    return this;
  }

  /**
   * Appends a comment to the end of the log line.
   *
   * @param {string[]} args - The comment text to append.
   * @returns {this} The current instance for chaining.
   */
  public comment(...args: string[]): this {
    this.appendSuffix(...args);
    return this;
  }

  /**
   * Appends a styled or unstyled part to the message.
   *
   * @param {string} str - The text content of the message part.
   * @param {MsgBuilder.StyleFormatterFn | null} [style] - An optional styling function.
   * @returns {this} The current instance for chaining.
   */
  appendMsgPart(str: string, style?: MsgBuilder.StyleFormatterFn | null): this {
    const part: MsgBuilder.MsgPart = { str: str };
    if (style) {
      part.style = style;
    }
    this._msgParts.push(part);
    return this;
  }

  /**
   * Prepends a styled or unstyled part to the message.
   *
   * @param {string} str - The text content of the message part.
   * @param {MsgBuilder.StyleFormatterFn | null} [style] - An optional styling function.
   * @returns {this} The current instance for chaining.
   */
  prependMsgPart(str: string, style?: MsgBuilder.StyleFormatterFn | null): this {
    const part: MsgBuilder.MsgPart = { str: str };
    if (style) {
      part.style = style;
    }
    this._msgParts.unshift(part);
    return this;
  }

  /**
   * Appends multiple arguments as a single, space-separated string.
   * @protected
   */
  protected appendMsg(...args: unknown[]): this {
    if (isNonEmptyArray(args)) {
      this.appendMsgPart(args.join(' '));
    }
    return this;
  }

  /**
   * Appends a suffix to the log message, typically used for comments.
   * @protected
   */
  protected appendSuffix(...args: string[]): this {
    this._suffix.push(args.join(' '));
    return this;
  }

  /**
   * Appends arguments to the message with an optional style.
   *
   * @param {MsgBuilder.StyleFormatterFn | null} style - The styling function to apply.
   * @param {MsgBuilder.StyleArg[]} args - The content to stylize and append.
   * @returns {this} The current instance for chaining.
   */
  public stylize(style: MsgBuilder.StyleFormatterFn | null, ...args: MsgBuilder.StyleArg[]): this {
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
   * Appends unstyled (plain) text to the message.
   *
   * @param {unknown[]} args - The content to append.
   * @returns {this} The current instance for chaining.
   */
  public plain(...args: unknown[]): this {
    return this.appendMsg(...args);
  }

  /**
   * Attaches structured data to the log entry.
   *
   * @remarks
   * If the message meets the log level threshold, the provided data will be
   * merged with any existing data on the log entry.
   *
   * @param {unknown} data - The structured data (typically an object) to attach.
   * @returns {this} The current instance for chaining.
   */
  public data(data: unknown): this {
    if (isDict(data) && this._meetsThreshold) {
      if (isDict(this._data)) {
        this._data = Object.assign(this._data, data);
      } else {
        this._data = data;
      }
    }
    return this;
  }

  /**
   * Finalizes the log message and forwards it to the emitter for processing.
   *
   * @remarks
   * This method should be called only once when the message is complete. It
   * assembles the final {@link Log.Entry} object, including all contextual
   * information from the emitter (e.g., `sid`, `reqId`), and passes it to the
   * emitter's `emit` method. The builder is then cleared for potential reuse.
   *
   * @param {unknown[]} args - Any final, unstyled text to append before emitting.
   * @returns {Log.Entry | undefined} The generated log entry if the threshold was met, otherwise `undefined`.
   */
  public emit(...args: unknown[]): Log.Entry | undefined {
    if (this._meetsThreshold) {
      this.appendMsg(...args);
      const entry: Log.Entry = {
        timestamp: this._timestamp,
        level: this._level,
        data: this._data,
        sid: this._emitter.sid,
        msg: this,
      };
      if (this._emitter.sid) {
        entry.sid = this._emitter.sid;
      }
      if (isNonEmptyArray(this._emitter.reqIds)) {
        entry.reqId = this._emitter.reqIds.join('.');
      }
      if (isNonEmptyArray(this._emitter.pkgs)) {
        entry.package = this._emitter.pkgs.join('.');
      }
      if (this._emitter) {
        this._emitter.emit(entry);
      }
      this.clear();
      return entry;
    }
    return undefined;
  }

  /**
   * Converts the message parts into a single, unformatted string.
   * @internal
   */
  partsAsString(): string {
    return this._msgParts?.map((p) => p.str).join(' ') || '';
  }

  /**
   * Formats the log message into a final string representation, applying colors
   * and styles as needed.
   *
   * @param {boolean} color - Whether to apply color and styling functions.
   * @param {Transport.OutputFormat} [_target=text] - The target output format (reserved for future use).
   * @returns {string} The formatted log message string.
   */
  format(color: boolean, _target: Transport.OutputFormat = Transport.OutputFormat.TEXT): string {
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
