import { StringEx } from '@epdoc/string';
import { _, type Integer } from '@epdoc/type';
import type * as Level from '../../levels/mod.ts';
import type { LogMgr } from '../../logmgr.ts';
import * as MsgBuilder from '../../message/mod.ts';
import type { Entry } from '../../types.ts';
import * as Base from '../base/mod.ts';
import { OutputFormat } from '../consts.ts';
import type { OutputFormatType, TransportEntry } from '../types.ts';
import type { ConsoleOptions } from './types.ts';

/**
 * A transport for logging messages to the console.
 *
 * This class provides a flexible way to output log entries to the console,
 * with support for different formats and color-coded output.
 *
 * @example
 * ```ts
 * const logMgr = new LogMgr();
 * const consoleTransport = new Console(logMgr, { format: 'json', color: false });
 * logMgr.add(consoleTransport);
 * ```
 */
export class ConsoleTransport<M extends MsgBuilder.Base.IBuilder> extends Base.Transport<M> {
  protected _levelWidth: Integer = 5;
  protected _format: OutputFormatType = OutputFormat.TEXT;
  protected _color: boolean = true;

  /**
   * Creates an instance of the `Console` transport.
   * @param {LogMgr<M>} logMgr - The log manager instance.
   * @param {ConsoleOptions} [opts={}] - Configuration options for the transport.
   */
  constructor(logMgr: LogMgr<M>, opts: ConsoleOptions = {}) {
    super(logMgr, opts);
    if (opts.format) {
      this._format = opts.format;
    }
    this._color = opts.color ?? true;
    this._bReady = true;
  }

  /**
   * Indicates whether the transport is configured to use color output.
   * @returns {boolean} `true` if color is enabled, otherwise `false`.
   */
  get useColor(): boolean {
    return this._color;
  }

  /**
   * Returns a string representation of the transport.
   * @returns {string} A string identifying the transport and its format.
   */
  override toString(): string {
    return `Console[${this._format}]`;
  }

  /**
   * Updates the transport's internal state when the log level threshold changes.
   * @returns {this} The current instance for method chaining.
   */
  override thresholdUpdated(): this {
    this._levelWidth = this._logMgr.logLevels.maxWidth(this._logMgr.threshold);
    return this;
  }

  /**
   * Emits a log entry to the console.
   *
   * This method formats and outputs the log entry based on the transport's
   * configuration. It is called by the `LogMgr` when a new log message is received.
   *
   * @param {Entry} msg - The log entry to be emitted.
   */
  override emit(msg: Entry) {
    const levelValue: Level.Value = this._logMgr.logLevels.asValue(msg.level);
    if (!this.meetsThresholdValue(levelValue)) {
      return;
    }

    const show = this._show;
    const logLevels = this._logMgr.logLevels;
    const color = this._color;

    const entry: TransportEntry = Object.assign(
      {
        timestamp: this.dateToString(msg.timestamp, show.timestamp ?? 'local'),
      },
      _.pick(msg, 'level', 'package', 'sid', 'reqId'),
    );

    if (msg.msg instanceof MsgBuilder.Base.Builder) {
      entry.msg = msg.msg.format(this._color, this._format);
    } else if (_.isString(msg.msg)) {
      entry.msg = msg.msg;
    }
    entry.data = msg.data;

    if (this._format === 'json') {
      this.output(JSON.stringify(entry), levelValue);
    } else if (this._format === 'jsonArray') {
      const parts: (string | null | object)[] = [];
      if (entry.timestamp) {
        parts.push(color ? logLevels.applyColors(entry.timestamp, msg.level) : entry.timestamp);
      } else {
        parts.push(null);
      }
      parts.push(entry.level ? this.styledLevel(entry.level, show.level) : null);
      parts.push(entry.package ?? null);
      parts.push(entry.sid ?? null);
      parts.push(entry.reqId ?? null);
      parts.push(entry.msg ?? null);
      parts.push(entry.data ?? null);
      this.output(JSON.stringify(parts), levelValue);
    } else {
      const parts: string[] = [];
      if (_.isString(entry.timestamp) && show.timestamp) {
        parts.push(color ? logLevels.applyColors(entry.timestamp, msg.level) : entry.timestamp);
      }

      if (show.level && entry.level) {
        parts.push(this.styledLevel(entry.level, show.level));
      }

      if (show.pkg && _.isNonEmptyString(entry.package)) {
        parts.push(this._styledString(entry.package, false, '_package'));
      }

      if (show.sid && _.isNonEmptyString(entry.sid)) {
        parts.push(this._styledString(entry.sid, false, '_sid'));
      }

      if (show.reqId && _.isNonEmptyString(entry.reqId)) {
        parts.push(this._styledString(entry.reqId, false, '_reqId'));
      }

      if (entry.msg) {
        parts.push(entry.msg);
      }

      if (!_.isNullOrUndefined(msg.data) && show.data) {
        parts.push(JSON.stringify(msg.data));
      }
      this.output(parts.join(' '), levelValue);
    }
  }

  /**
   * Outputs a string to the console.
   *
   * @param {string} str - The string to be output.
   * @param {Level.Value} _levelValue - The numerical value of the log level.
   * @returns {Promise<void>} A promise that resolves when the output is complete.
   */
  output(str: string, _levelValue: Level.Value): Promise<void> {
    console.log(str);
    return Promise.resolve();
  }

  /**
   * Styles the log level string with padding and color.
   *
   * @param {Level.Name} level - The name of the log level.
   * @param {boolean | Integer | undefined} show - Configuration for displaying the level.
   * @returns {string} The styled log level string.
   */
  styledLevel(level: Level.Name, show: boolean | Integer | undefined): string {
    let s = StringEx(level).rightPad(this._levelWidth);
    if (_.isInteger(show)) {
      if (show > 0) {
        s = StringEx(level).rightPad(show, ' ', true);
      } else if (show < 0) {
        s = StringEx(level).leftPad(0 - show, ' ', true);
      }
    }
    s = '[' + s + ']';
    if (this._color) {
      return this._logMgr.logLevels.applyColors(s, level);
    }
    return s;
  }

  /**
   * Applies styling to a string value, including padding and color.
   *
   * @param {string} val - The string value to be styled.
   * @param {boolean | number} show - Determines if and how the string is padded.
   * @param {string} colorFn - The name of the color function to use for styling.
   * @param {object} [opts] - Additional options for prefixing and postfixing the string.
   * @param {string} [opts.pre] - A prefix to add to the string.
   * @param {string} [opts.post] - A postfix to add to the string.
   * @returns {string} The styled string.
   * @protected
   */
  _styledString(
    val: string,
    show: boolean | number,
    colorFn: string,
    opts?: { pre: string; post: string },
  ): string {
    let s = val;
    if (_.isInteger(show)) {
      if (show > 0) {
        s = StringEx(val).rightPad(show, ' ', true);
      } else if (show < 0) {
        s = StringEx(val).leftPad(0 - show, ' ', true);
      }
    }
    if (opts) {
      if (opts.pre) {
        s = opts.pre + s;
      }
      if (opts.post) {
        s += opts.post;
      }
    }
    if (this._color && MsgBuilder.Console.styleFormatters[colorFn]) {
      return (MsgBuilder.Console.styleFormatters as Record<string, (str: string) => string>)[colorFn](s);
    }
    return s;
  }
}
