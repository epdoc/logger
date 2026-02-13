import type { Entry } from '$log';
import type * as Level from '@epdoc/loglevels';
import * as MsgBuilder from '@epdoc/msgbuilder';
import { StringEx } from '@epdoc/string';
import { _, type Integer } from '@epdoc/type';
import * as Base from '../base/mod.ts';
import { OutputFormat } from '../consts.ts';
import type { ILogMgrTransportContext, OutputFormatType, TransportEntry } from '../types.ts';
import { consoleStyleFormatters } from './consts.ts';
import type * as Console from './types.ts';

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
export class ConsoleTransport extends Base.Transport {
  public override readonly type: string = 'console';
  protected _levelWidth: Integer = 5;
  protected _format: OutputFormatType = OutputFormat.TEXT;
  protected _color: boolean = true;
  protected _useStderr: boolean = false;

  /**
   * Creates an instance of the `Console` transport.
   * @param {ILogMgrTransportContext} logMgr - The log manager context.
   * @param {Options} [opts={}] - Configuration options for the transport.
   * @param opts.format - Output format ('text', 'json', or 'json-array')
   * @param opts.color - Whether to use colors in output (defaults to true)
   * @param opts.threshold - Minimum log level for this transport
   * @param opts.flushThreshold - Log level that triggers immediate flush
   */
  constructor(logMgr: ILogMgrTransportContext, opts: Console.Options = {}) {
    super(logMgr, opts);
    if (opts.format) {
      this._format = opts.format;
    }
    this._color = opts.color ?? true;
    this._useStderr = opts.useStderr ?? false;
    this._bReady = true;
  }

  /**
   * Indicates whether the transport is configured to use color output.
   * @returns {boolean} `true` if color is enabled, otherwise `false`.
   */
  get useColor(): boolean {
    return this._color === true && this._show.color !== false;
  }

  /**
   * Returns a string representation of the transport.
   * @returns {string} A string identifying the transport and its format.
   */
  override toString(): string {
    return `Console[${this._format},${this._color ? 'color' : 'no-color'}]`;
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
    const _logLevels = this._logMgr.logLevels;
    const color = this.useColor;

    const entry: TransportEntry = Object.assign(
      {
        timestamp: this.dateToString(msg.timestamp, show.timestamp ?? 'local'),
      },
      _.pick(msg, 'level', 'sid', 'pkg', 'reqId', 'time'),
    );

    if (msg.msg instanceof MsgBuilder.Abstract) {
      const target = this._format === 'text' ? 'console' : this._format as MsgBuilder.EmitterTarget;
      entry.msg = msg.msg.format({ color: color, target });
    } else if (_.isString(msg.msg)) {
      entry.msg = msg.msg;
    } else {
      entry.msg = '';
    }
    entry.data = msg.data;

    if (this._format === 'json') {
      // Output as JSON object
      this.output(JSON.stringify(entry), levelValue);
    } else if (this._format === 'jsonArray') {
      // Output as JSON Array
      const text = this.formatJsonArrayEntry(entry, msg);
      this.output(text, levelValue);
      // } else if (this._format === 'otlp') {
      //   // Output as OpenTelemetry Protocol JSON (for Deno OTEL auto-export)
      //   const otlpEntry = this.formatOtlpEntry(entry, msg);
      //   const asStr = JSON.stringify(otlpEntry);
      //   this.output(asStr, levelValue);
    } else {
      const text = this.formatTextEntry(entry, msg);
      this.output(text, levelValue);
    }
  }

  formatTextEntry(entry: TransportEntry, msg: Entry): string {
    const parts: string[] = [];
    if (_.isString(entry.timestamp) && this._show.timestamp) {
      parts.push(entry.timestamp);
    }

    if (this._show.level && entry.level) {
      parts.push(this.styledLevel(entry.level, this._show.level));
    }

    if (this._show.pkg && _.isNonEmptyString(entry.pkg)) {
      parts.push(this._styledString(entry.pkg, false, '_package'));
    }

    if (this._show.sid && _.isNonEmptyString(entry.sid)) {
      parts.push(this._styledString(entry.sid, false, '_sid'));
    }

    if (this._show.reqId && _.isNonEmptyString(entry.reqId)) {
      parts.push(this._styledString(entry.reqId, false, '_reqId'));
    }

    if (entry.msg) {
      parts.push(entry.msg);
    }
    if (this._show.time && _.isNumber(entry.time) && entry.time) {
      // Format duration with appropriate precision
      let digits = 3;
      if (entry.time > 100) {
        digits = 0;
      } else if (entry.time > 10) {
        digits = 1;
      } else if (entry.time > 1) {
        digits = 2;
      }
      parts.push(this._styledString(`(${entry.time.toFixed(digits)} ms)`, false, '_elapsed'));
    }

    if (!_.isNullOrUndefined(msg.data) && this._show.data) {
      parts.push(JSON.stringify(msg.data));
    }
    return parts.join(' ');
  }

  formatJsonArrayEntry(entry: TransportEntry, msg: Entry): string {
    const logLevels = this._logMgr.logLevels;
    const color = this.useColor;
    const parts: (string | null | object | number)[] = [];
    if (_.isString(entry.timestamp) && this._show.timestamp) {
      parts.push(color ? logLevels.applyColors(entry.timestamp, msg.level) : entry.timestamp);
    } else {
      parts.push(null);
    }
    parts.push(entry.level ? this.styledLevel(entry.level, this._show.level) : null);
    parts.push(entry.pkg ?? null);
    parts.push(entry.sid ?? null);
    parts.push(entry.reqId ?? null);
    parts.push(entry.msg ?? null);
    parts.push(entry.time ?? null);
    parts.push(entry.data ?? null);
    return JSON.stringify(parts);
  }

  /**
   * Outputs a string to the console.
   *
   * @param {string} str - The string to be output.
   * @param {Level.Value} _levelValue - The numerical value of the log level.
   * @returns {Promise<void>} A promise that resolves when the output is complete.
   */
  output(str: string, _levelValue: Level.Value): Promise<void> {
    if (this._useStderr) {
      console.error(str);
    } else {
      console.log(str);
    }
    return Promise.resolve();
  }

  /**
   * Styles the log level string with padding and color.
   *
   * @param {Level.Name} level - The name of the log level.
   * @param {boolean | Integer | undefined} show - Configuration for displaying the level.
   * @returns {string} The styled log level string.
   */
  styledLevel(level: Level.Name, show: boolean | Integer | 'icon' | undefined): string {
    let s = '';
    if (show === 'icon') {
      const def = this._logMgr.logLevels.levelDefs[level];
      if (def && def.icon) {
        s = def.icon;
      }
      show = true;
    }
    if (show && !s.length) {
      s = StringEx(level).rightPad(this._levelWidth);
      if (_.isInteger(show)) {
        if (show > 0) {
          s = StringEx(level).rightPad(show, ' ', true);
        } else if (show < 0) {
          s = StringEx(level).leftPad(0 - show, ' ', true);
        }
      }
    }
    s = '[' + s + ']';
    if (this.useColor) {
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
    if (this.useColor && consoleStyleFormatters[colorFn]) {
      return (consoleStyleFormatters as Console.StyleFormatterMap)[colorFn](s);
    }
    return s;
  }
}
