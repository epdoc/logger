import { _, type Dict, type Integer } from '@epdoc/type';
import { ConsoleEmitter } from './emitter.ts';
import type { EmitterData, FormatOpts, IEmitter, IFormatter, MsgPart, StyleArg, StyleFormatterFn } from './types.ts';
import { StringUtil } from './util.ts';

const DEFAULT_TAB_SIZE = 2;

/**
 * The foundational message builder for creating structured, stylable log messages.
 *
 * @remarks
 * This abstract class provides a fluent, chainable interface for constructing
 * log messages piece by piece. It serves two primary purposes:
 *
 * 1.  **Logging:** When associated with a logger `IEmitter`, it builds a log
 *     entry that can be emitted to a transport.
 * 2.  **Standalone Formatting:** When used without an `IEmitter`, it functions
 *     as a general-purpose string builder with styling capabilities.
 *
 * It manages message parts, indentation, conditional logic, and structured
 * data, and implements the {@link IFormatter} interface for final string conversion.
 */
export abstract class AbstractMsgBuilder implements IFormatter {
  protected _timestamp: Date = new Date();
  protected _tabSize: Integer = DEFAULT_TAB_SIZE;
  protected _emitter: IEmitter;

  protected _msgIndent: string = '';
  protected _msgParts: MsgPart[] = [];
  protected _data: Dict | undefined;
  protected _suffix: string[] = [];
  protected _showElapsed: boolean = false;
  protected _allow: boolean = true;
  protected _conditionalMet = false;

  /**
   * Initializes a new message builder instance.
   *
   * When `emitter` is not provided, the builder operates in a "standalone"
   * mode. In this mode, the `emit()` method is disabled, but the builder can
   * still be used for formatting and styling strings.
   */
  constructor(emitter?: IEmitter) {
    this._emitter = emitter ?? new ConsoleEmitter();
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
   * @param {...StyleArg[]} args - The arguments to set as the initial string.
   * @returns {this} The current instance for method chaining.
   * @deprecated
   */
  setInitialString(...args: StyleArg[]): this {
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
    if (_.isInteger(n)) {
      this.appendMsgPart(' '.repeat(n - 1));
    } else if (_.isNonEmptyString(n)) {
      this.appendMsgPart(n);
    }
    return this;
  }

  /**
   * Sets the indentation level based on tab counts.
   * @deprecated Use {@link indent} and {@link outdent} instead
   */
  tab(n: Integer = 1): this {
    this._msgIndent = ' '.repeat(n * this._tabSize - 1);
    return this;
  }

  public if(val: boolean): this {
    this._conditionalMet = val;
    this._allow = val;
    return this;
  }

  public elif(val: boolean): this {
    if (this._conditionalMet) {
      this._allow = false;
    } else {
      this._allow = val;
      if (val) {
        this._conditionalMet = true;
      }
    }
    return this;
  }

  public else(): this {
    if (this._conditionalMet) {
      this._allow = false;
    } else {
      this._allow = true;
      this._conditionalMet = true;
    }
    return this;
  }

  public endif(): this {
    this._allow = true;
    this._conditionalMet = false;
    return this;
  }

  /**
   * Appends a styled or unstyled part to the message.
   *
   * @param {string} str - The text content of the message part.
   * @param {StyleFormatterFn | null} [style] - An optional styling function.
   * @returns {this} The current instance for chaining.
   */
  appendMsgPart(str: string, style?: StyleFormatterFn | null): this {
    const part: MsgPart = { str: str };
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
   * @param {StyleFormatterFn | null} [style] - An optional styling function.
   * @returns {this} The current instance for chaining.
   */
  prependMsgPart(str: string, style?: StyleFormatterFn | null): this {
    const part: MsgPart = { str: str };
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
    if (_.isNonEmptyArray(args)) {
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
   * @param {StyleFormatterFn | null} style - The styling function to apply.
   * @param {StyleArg[]} args - The content to stylize and append.
   * @returns {this} The current instance for chaining.
   */
  public stylize(style: StyleFormatterFn | null, ...args: StyleArg[]): this {
    if (!this._allow) return this;
    if (_.isNonEmptyArray(args)) {
      const str = args
        .map((arg) => {
          if (_.isNonEmptyString(arg)) {
            return arg;
          } else if (_.isDict(arg) || _.isNonEmptyArray(arg)) {
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
    if (!this._allow) return this;
    return this.appendMsg(...args);
  }

  /**
   * Appends a comment to the end of the log line.
   *
   * @param {string[]} args - The comment text to append.
   * @returns {this} The current instance for chaining.
   */
  public comment(...args: string[]): this {
    if (!this._allow) return this;
    this.appendSuffix(...args);
    return this;
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
    if (!this._allow) return this;
    if (_.isDict(data) && this._emitter.dataEnabled) {
      if (_.isDict(this._data)) {
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
   * If the builder was created without an `emitter`, this method does nothing
   * and returns `undefined`.
   *
   * @param {unknown[]} args - Any final, unstyled text to append before emitting.
   * @returns {Log.Entry | undefined} The generated log entry if the threshold was met and an emitter is configured, otherwise `undefined`.
   */
  public emit(...args: unknown[]): EmitterData | undefined {
    if (this._emitter && this._emitter.emitEnabled) {
      this.appendMsg(...args);
      const entry: EmitterData = {
        timestamp: this._timestamp,
        data: this._data,
        formatter: this,
      };
      this._emitter.emit(entry);
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
   * and styles if the color parameter is true and NO_COLOR is false.
   *
   * @param {boolean} color - Whether to enable color and styling functions.
   * @param {Transport.OutputFormatType} [_target=text] - The target output format (reserved for future use).
   * @returns {string} The formatted log message string.
   */
  format(opts?: FormatOpts): string {
    let noColor = Deno.noColor;
    if (opts) {
      if (opts.color === true) noColor = false;
      if (opts.color === false) noColor = true;
    }
    const parts: string[] = [];
    if (_.isNonEmptyString(this._msgIndent)) {
      parts.push(this._msgIndent);
    }
    this._msgParts.forEach((part: MsgPart) => {
      if (part.style && !noColor) {
        parts.push(part.style(part.str));
      } else {
        parts.push(part.str);
      }
    });
    return parts.join(' ');
  }

  /**
   * If you just want to output the message, and aren't using any of the logging support capabilities
   */
  log(): void {
    console.log(this.format());
  }
}
