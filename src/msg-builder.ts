import {
  Integer,
  isDefined,
  isInteger,
  isNonEmptyArray,
  isNonEmptyString,
  isNumber,
  isString,
  pick
} from '@epdoc/typeutil';
import { LogLevel, LogLevelValue } from './level';
import { AppTimer } from './lib/app-timer';
import { StringEx } from './lib/util';
import { Logger } from './logger';
import { Style } from './style';
import {
  LoggerLineOpts,
  LoggerShowOpts,
  LogMessage,
  LogMsgPart,
  SeparatorOpts,
  StyleFormatterFn
} from './types';

const DEFAULT_TAB_SIZE = 2;

/**
 * A LoggerLine is a line of output from a Logger. It is used to build up a log
 * line, add styling, and emit the log line.
 */
export class LoggerMessageBuilder {
  protected _logger: Logger;
  protected _opts: LoggerLineOpts = {};
  protected _showOpts: LoggerShowOpts;
  protected _tabSize: Integer = DEFAULT_TAB_SIZE;
  // protected _lineFormat: LoggerLineFormatOpts;
  // protected _style: StyleInstance;
  protected _separatorOpts: SeparatorOpts;
  protected _logLevels: LogLevel;

  protected _level: LogLevelValue;
  protected _enabled: boolean = false;
  protected _msgIndent: string = '';
  protected _msgParts: LogMsgPart[] = [];
  protected _suffix: string[] = [];
  protected _timer: AppTimer;
  // protected _level: LogLevelValue = logLevel.info;
  protected _showElapsed: boolean = false;
  protected _msg: LogMessage = {
    parts: []
  };
  // protected _reqId: string;
  // protected _sid: string;
  // protected _emitter: string;
  // protected _action: string;
  protected _data: Record<string, any> = {};

  constructor(opts: LoggerLineOpts) {
    this._opts = opts;
    this._msg = Object.assign(this._msg, opts.msg);
    // this._logLevels = opts.logLevels;
    // this._separatorOpts = opts.separatorOpts;
    this.addStyleMethods();
  }

  // setOpts(opts: LoggerLineOpts): this {
  //   this._opts = opts;
  //   return this;
  // }

  /**
   * Changes the level threshold that was initially set. Does so equally for all
   * transports.
   * @param {LogLevelValue} val - The level threshold.
   * @returns {this} The LoggerLine instance.
   */
  // setLevelThreshold(val: LogLevelValue): this {
  //   this._levelThreshold = val;
  //   return this;
  // }

  meetsThreshold(): boolean {
    return this._logLevels.meetsThreshold(this._level);
  }

  // separatorOpts(opts: SeparatorOpts): this {
  //   this._separatorOpts = opts;
  //   return this;
  // }

  setLevel(val: LogLevelValue): this {
    this._level = val;
    this._enabled = this.meetsThreshold();
    return this;
  }

  get level(): LogLevelValue {
    return this._msg.level;
  }

  get logLevel(): LogLevel {
    return this._opts.logLevels;
  }

  get separatorOpts(): SeparatorOpts {
    return this._opts.separatorOpts;
  }

  get style(): Style {
    return this._opts.style;
  }

  /**
   * Returns true if the line is empty of a composed string message
   * @returns {boolean} - True if the line is empty, false otherwise.
   */
  // isEmpty(): boolean {
  //   return this._msgParts.length === 0;
  // }

  // get stylizeEnabled(): boolean {
  //   return this._lineFormat.stylize ?? false;
  // }

  // get style(): StyleInstance {
  //   return this._style;
  // }

  /**
   * For logging in an Express or Koa environment, sets the request ID for this
   * line of output. Use is entirely optional.
   * @param {string} id - The request ID.
   * @returns {this} The LoggerLine instance.
   */
  reqId(id: string): this {
    this._msg.reqId = id;
    return this;
  }

  /**
   * Add the session ID for this line of output. Use is entirely optional.
   * @param {string} id - The session ID.
   * @returns {this} The LoggerLine instance.
   */
  sid(id: string): this {
    this._msg.sid = id;
    return this;
  }

  /**
   * Add the emitter for this line of output. The emitter can be a class name,
   * module name, or other identifier. Use is entirely optional.
   * @param {string} name - The emitter name.
   * @returns {this} The LoggerLine instance.
   */
  emitter(name: string): this {
    this._msg.emitter = name;
    return this;
  }

  /**
   * Add the action for this line of output. The action is usually a verb for
   * what this line is doing. Use is entirely optional.
   * @param {string} name - The action name.
   * @returns {this} The LoggerLine instance.
   */
  action(...args: string[]) {
    this._msg.action = args.join('.');
    return this;
  }

  separator() {
    if (this.meetsThreshold()) {
      const opts = this._separatorOpts;
      let sep = opts.char.repeat(Math.floor(opts.length / opts.char.length));
      this.plain(sep);
    }
    return this;
  }

  /**
   * Set a property or multiple properties in the <code>data</code> column.
   * @example
   * log.info().data('a',3).data('b',4).emit();
   * log.info().data({a:3,b:4}).emit();
   *
   * @param {string|object} key - If a string then sets <code>data[key]</code> to
   *   <code>value</code>. Otherwise extend the object <code>data</code> with the object
   *   <code>key</code>.
   * @param [value] {string} If key is a string then sets <code>data[key]</code> to this value.
   * @return {Logger}
   */
  data(key: string | any, value: any): this {
    return this._setData(key, value);
  }

  /**
   * Common method used by the {@link Logger#data} method.
   * @param field
   * @param key
   * @param value
   * @returns {Logger}
   * @private
   */
  _setData(key: string | any, value: any): this {
    if ((isString(key) || isNumber(key)) && isDefined(value)) {
      if (!this._msg.data) {
        this._msg.data = {};
      }
      this._msg.data[key] = value;
    } else {
      this._msg.data = Object.assign(this._msg.data, key);
    }
    return this;
  }

  /**
   * Clears the current line, essentially resetting the output line. This does
   * not clear the reqId, sid or emitter values.
   * @returns {this} The LoggerLine instance.
   */
  clear(): this {
    this._msg = pick(this._msg, 'reqId', 'sid');
    this._msg.parts = [];
    return this;
  }

  setInitialString(...args: any[]): LogMsgBuilder {
    if (args.length) {
      const count = StringEx(args[0]).countTabsAtBeginningOfString();
      if (count) {
        this.tab(count);
        args[0] = args[0].slice(count);
      }
    }
    return this.stylize(null, ...args);
  }

  indent(n: Integer | string = DEFAULT_TAB_SIZE): this {
    if (this._enabled) {
      if (isInteger(n)) {
        this.addMsgPart(' '.repeat(n - 1));
      } else if (isNonEmptyString(n)) {
        this.addMsgPart(n);
      }
    }
    return this;
  }

  /**
   * Sets the indentation level of this line of log output..
   * @param {Integer} n - The number of tabs by which to indent.
   * @returns {this} The Logger instance.
   */
  tab(n: Integer = 1): this {
    if (this._enabled) {
      this._msgIndent = ' '.repeat(n * this._tabSize - 1);
    }
    return this;
  }

  /**
   * Adds a comment to the end of the log line.
   * @param {any} args - The arguments to add.
   * @returns {this} The Logger instance.
   */
  comment(...args: string[]): this {
    this.appendSuffix(...args);
    return this;
  }

  protected addMsgPart(str: string, style?: StyleFormatterFn): this {
    // const _style = this.stylizeEnabled ? style : undefined;
    this._msgParts.push({ str: str, style: style });
    return this;
  }

  protected appendMsg(...args: string[]): this {
    if (this._enabled) {
      this._msgParts.push({ str: args.join(' ') });
    }
    return this;
  }

  protected appendSuffix(...args: string[]): this {
    this._suffix.push(args.join(' '));
    return this;
  }

  // /**
  //  * Adds styled text to the log line.
  //  * @param {any} val - The value to stylize.
  //  * @param {StyleName | StyleDef} style - The style to use.
  //  * @returns {this} The Logger instance.
  //  */
  // stylizeOld(style: StyleName, ...args): LoggerLineInstance {
  //   if (args.length) {
  //     this._transportLines.forEach((transportLine) => transportLine.stylize(style, ...args));
  //   }
  //   return this as unknown as LoggerLineInstance;
  // }

  stylize(style: StyleFormatterFn, ...args): LogMsgBuilder {
    if (this._enabled) {
      this.addMsgPart(args.join(' '), style);
    }
    return this as unknown as LogMsgBuilder;
  }

  /**
   * Adds plain text to the log line.
   * @param {any} args - The arguments to add.
   * @returns {this} The Logger instance.
   */
  plain(...args: any[]): this {
    if (this._enabled && isNonEmptyArray(args)) {
      this.appendMsg(...args);
    }
    return this;
  }

  /**
   * Emits the log line with elapsed time. This is a convenience method for
   * emitting the log line with elapsed time without having to call `elapsed()`
   * first.
   * @param {any[]} args - The arguments to emit.
   * @returns {void}
   * @see elapsed()
   * @see emit()
   */
  emitWithTime(...args: any[]): void {
    this._showElapsed = true;
    return this.emit(...args);
  }

  /**
   * Emits the log line with elapsed time (Emit With Time = EWT). This is a
   * convenience method for emitting the log line with elapsed time without
   * having to call `elapsed()` first.
   * @param {any[]} args - The arguments to emit.
   * @returns {void}
   * @see elapsed()
   * @see emit()
   * @see emitWithTime()
   */
  ewt(...args: any[]): void {
    this._showElapsed = true;
    return this.emit(...args);
  }

  /**
   * Emits the log line.
   * @param {any[]} args - The arguments to emit.
   * @returns {void}
   * @see ewt()
   * @see emitWithTime()
   */
  emit(...args: any[]): void {
    if (this._enabled) {
      this._logger.logParams(this._msg);
      this.clear();
    }
  }

  /**
   * Adds our dynamic style methods to the logger instance.
   * @returns {void}
   */
  private addStyleMethods(): this {
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

    for (const name in defaultStyles) {
      if (!name.startsWith('_')) {
        if (methodNames.includes(name)) {
          throw new Error(`Cannot declare style with reserved name ${name}`);
        }
        (this as any)[name] = (...args: any[]): LogMsgBuilder => {
          // @ts-ignore
          this.stylize(name as StyleName, ...args);
          return this as unknown as LogMsgBuilder;
        };
      }
    }
    return this;
  }
}

export type LogMsgBuilder = LoggerMessageBuilder & {
  [key in MethodName]: (...args: any[]) => LogMsgBuilder; // Ensure dynamic methods return LoggerLineInstance
};
