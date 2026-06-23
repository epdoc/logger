import type { Entry } from '$log';
import * as Level from '@epdoc/loglevels';
import * as MsgBuilder from '@epdoc/msgbuilder';
import { padLeft, padRight } from '@epdoc/text/text';
import { _, type Integer } from '@epdoc/type';
import * as Base from '../base/mod.ts';
import { OutputFormat } from '../consts.ts';
import type * as Transport from '../types.ts';
import { consoleStyleFormatters } from './consts.ts';
import type * as Console from './types.ts';
import type { TransportStyleMap } from './types.ts';

/**
 * A transport for logging messages to the console.
 *
 * This class provides a flexible way to output log entries to the console,
 * with support for different formats and color-coded output.
 *
 * ### Theming Column Styles
 *
 * The active style map for metadata columns is held on the static
 * `columnStyles` property and defaults to {@link consoleStyleFormatters}.
 * Override this to theme transport columns (e.g. session ID, request ID,
 * elapsed time):
 *
 * ```ts
 * import { Console } from '@epdoc/logger/transports';
 * Console.Transport.columnStyles = myCustomStyles;
 * ```
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
  protected _format: Transport.OutputFormatType = OutputFormat.TEXT;
  protected _color: boolean = true;
  protected _useStderr: boolean = false;
  protected _progress: boolean = false;
  protected _isTTY: boolean | undefined = undefined;

  /**
   * The active style map for metadata columns.
   *
   * Assign a different {@link TransportStyleMap} here to change the theme for
   * all instances of this class (or its subclasses, unless they declare their
   * own `static columnStyles`).
   *
   * @example
   * ```ts
   * import { Console } from '@epdoc/logger/transports';
   * Console.Transport.columnStyles = myCustomStyles;
   * ```
   */
  static columnStyles: TransportStyleMap = consoleStyleFormatters;

  /**
   * Creates an instance of the `Console` transport.
   * @param {TransportBaseOptions} logMgr - The log manager context.
   * @param {Options} [opts={}] - Configuration options for the transport.
   * @param opts.format - Output format ('text', 'json', or 'json-array')
   * @param opts.color - Whether to use colors in output (defaults to true)
   * @param opts.useStderr - Whether to output to stderr instead of stdout (for MCP mode)
   * @param opts.progress - Whether to enable progress mode for TTY terminals
   * @param opts.isTTY - Override TTY detection (auto-detected if not set)
   */
  constructor(baseOpts: Transport.IBaseOptions, opts: Console.Options = {}) {
    super(baseOpts, opts);
    if (opts.format) {
      this._format = opts.format;
    }
    this._color = opts.color ?? true;
    this._useStderr = opts.useStderr ?? false;
    this._progress = opts.progress ?? false;
    this._isTTY = opts.isTTY;
    this._bReady = true;
  }

  /**
   * Returns the style map for the current class.
   *
   * Reading via `this.constructor` ensures subclasses that declare their own
   * `static columnStyles` use their own theme without overriding any methods.
   */
  protected get _columnStyles(): TransportStyleMap {
    return (this.constructor as typeof ConsoleTransport).columnStyles;
  }

  /**
   * Indicates whether the transport is configured to use color output.
   * @returns {boolean} `true` if color is enabled, otherwise `false`.
   */
  get useColor(): boolean {
    return this._color === true && this.show.color !== false;
  }

  /**
   * Returns a string representation of the transport.
   * @returns {string} A string identifying the transport and its format.
   */
  override toString(): string {
    return `Console[${this._format},${this._color ? 'color' : 'no-color'}]`;
  }

  /**
   * Indicates whether the transport is running in a TTY (interactive terminal).
   * Auto-detects if not explicitly set via options.
   * @returns {boolean} `true` if running in a TTY, otherwise `false`.
   */
  get isTTY(): boolean {
    if (this._isTTY !== undefined) {
      return this._isTTY;
    }
    // Auto-detect TTY capability using modern Deno API
    try {
      return this._useStderr ? Deno.stderr.isTerminal() : Deno.stdout.isTerminal();
    } catch {
      return false;
    }
  }

  /**
   * Indicates whether progress mode is enabled and can be used.
   * Progress requires TTY mode, progress option enabled, and not in MCP mode (useStderr).
   * @returns {boolean} `true` if progress mode can be used, otherwise `false`.
   */
  override get canShowProgress(): boolean {
    return this.isTTY && this._progress && !this._useStderr;
  }

  /**
   * Updates the transport's internal state when the log level threshold changes.
   * @returns {this} The current instance for method chaining.
   */
  override thresholdUpdated(): this {
    this._levelWidth = this.logLevels.maxWidth(this.threshold);
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
    if (!this.emitFilter(msg)) {
      return;
    }

    const show = this.show;
    const _logLevels = this.logLevels;
    const color = this.useColor;

    const entry: Transport.Entry = Object.assign(
      {
        timestamp: this.dateToString(msg.timestamp, show.timestamp ?? 'local'),
      },
      _.pick(msg, 'level', 'sid', 'pkg', 'reqId', 'time'),
    );

    if (msg.msg instanceof MsgBuilder.Abstract) {
      const target = this._format === 'text' ? 'console' : this._format as MsgBuilder.EmitterTarget;
      entry.msg = msg.msg.format({ color: color, target, msgSep: msg.msgSep });
    } else if (_.isString(msg.msg)) {
      entry.msg = msg.msg;
    } else {
      entry.msg = '';
    }
    entry.data = msg.data;

    if (this._format === 'json') {
      // Output as JSON object
      this.output(JSON.stringify(entry), msg.level);
    } else if (this._format === 'jsonArray') {
      // Output as JSON Array
      const text = this.formatJsonArrayEntry(entry, msg);
      this.output(text, msg.level);
      // } else if (this._format === 'otlp') {
      //   // Output as OpenTelemetry Protocol JSON (for Deno OTEL auto-export)
      //   const otlpEntry = this.formatOtlpEntry(entry, msg);
      //   const asStr = JSON.stringify(otlpEntry);
      //   this.output(asStr, levelValue);
    } else {
      const text = this.formatTextEntry(entry, msg);
      this.output(text, msg.level);
    }
  }

  formatTextEntry(entry: Transport.Entry, msg: Entry): string {
    const parts: string[] = [];
    if (_.isString(entry.timestamp) && this.show.timestamp) {
      parts.push(entry.timestamp);
    }

    if (this.show.level && entry.level) {
      parts.push(this.styledLevel(entry.level, this.show.level));
    }

    if (this.show.pkg && _.isNonEmptyString(entry.pkg)) {
      parts.push(this._styledString(entry.pkg, false, '_package'));
    }

    if (this.show.sid && _.isNonEmptyString(entry.sid)) {
      parts.push(this._styledString(entry.sid, false, '_sid'));
    }

    if (this.show.reqId && _.isNonEmptyString(entry.reqId)) {
      parts.push(this._styledString(entry.reqId, false, '_reqId'));
    }

    if (entry.msg) {
      parts.push(entry.msg);
    }
    if (this.show.time && _.isNumber(entry.hrMsTime) && entry.hrMsTime) {
      // Format duration with appropriate precision
      let digits = 3;
      if (entry.hrMsTime > 100) {
        digits = 0;
      } else if (entry.hrMsTime > 10) {
        digits = 1;
      } else if (entry.hrMsTime > 1) {
        digits = 2;
      }
      parts.push(this._styledString(`(${entry.hrMsTime.toFixed(digits)} ms)`, false, '_elapsed'));
    }

    if (!_.isNullOrUndefined(msg.data) && this.show.data) {
      parts.push(JSON.stringify(msg.data));
    }
    const sep = this.show.columnSep ?? ' ';
    return parts.join(sep);
  }

  formatJsonArrayEntry(entry: Transport.Entry, msg: Entry): string {
    const color = this.useColor;
    const parts: (string | null | object | number)[] = [];
    if (_.isString(entry.timestamp) && this.show.timestamp) {
      parts.push(color ? Level.applyColors(entry.timestamp, msg.level) : entry.timestamp);
    } else {
      parts.push(null);
    }
    parts.push(entry.level ? this.styledLevel(entry.level, this.show.level) : null);
    parts.push(entry.pkg ?? null);
    parts.push(entry.sid ?? null);
    parts.push(entry.reqId ?? null);
    parts.push(entry.msg ?? null);
    parts.push(entry.hrMsTime ?? null);
    parts.push(entry.data ?? null);
    return JSON.stringify(parts);
  }

  /**
   * Outputs a string to the console.
   *
   * @param {string} str - The string to be output.
   * @param {Level.Severity} _levelValue - The numerical value of the log level.
   * @returns {Promise<void>} A promise that resolves when the output is complete.
   */
  output(str: string, _levelValue: Level.Spec): Promise<void> {
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
  styledLevel(level: Level.Spec, show: boolean | Integer | 'icon' | undefined): string {
    let s = '';
    if (show === 'icon') {
      if (level.icon) {
        s = level.icon;
      }
      show = true;
    }
    if (show && !s.length) {
      s = padRight(level.name, this._levelWidth, ' ');
      if (_.isInteger(show)) {
        if (show > 0) {
          s = padRight(level.name, show, ' ');
        } else if (show < 0) {
          s = padLeft(level.name, 0 - show, ' ');
        }
      }
    }
    s = '[' + s + ']';
    if (this.useColor) {
      return Level.applyColors(s, level);
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
        s = padRight(val, show, ' ');
      } else if (show < 0) {
        s = padLeft(val, 0 - show, ' ');
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
    if (this.useColor && this._columnStyles[colorFn]) {
      return this._columnStyles[colorFn](s);
    }
    return s;
  }
}
