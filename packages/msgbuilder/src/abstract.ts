import type { Spec } from '@epdoc/colors';
import { toStyleFn } from '@epdoc/colors';
import { DateTime } from '@epdoc/datetime';
import type { HrMilliseconds } from '@epdoc/duration';
import { _, type Dict, type Integer } from '@epdoc/type';
import { bold, dim } from '@std/fmt/colors';
import { stripAnsi, visualLength } from '@epdoc/terminal/screen';
import { ConsoleEmitter } from './emitter.ts';
import type {
  EmitterData,
  FormatOpts,
  IEmitter,
  IFormatter,
  IndentLevel,
  MsgPart,
  QuoteTheme,
  StyleArg,
  StyleFormatterFn,
  WrapOptions,
} from './types.ts';
import { countTabsAtBeginningOfString } from './util.ts';

const DEFAULT_TAB_SIZE = 2;
const SPACES_CACHE = Array.from({ length: 17 }, (_, i) => ' '.repeat(i));

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
  protected _timestamp: DateTime = DateTime.now().setTz();
  protected _elapsed: HrMilliseconds = 0;
  protected _tabSize: Integer = DEFAULT_TAB_SIZE;
  protected _emitter: IEmitter;

  protected _msgIndent: string = '';
  /**
   * How to wrap this message. Unset means one row, however long it is: wrapping
   * only happens when a {@link TextBuilder} sets a width.
   */
  protected _wrap: WrapOptions | undefined;
  /**
   * The `wrap(n)` value: extra indentation for continuation rows. Kept apart
   * from {@link _wrap} so it survives a width being applied later.
   */
  protected _wrapIndent: Integer | undefined;
  protected _msgParts: MsgPart[] = [];
  protected _data: Dict | undefined;
  protected _suffix: string[] = [];
  protected _showElapsed: boolean = false;
  protected _allowStack: boolean[] = [];
  protected _conditionMetStack: boolean[] = [];
  protected _dimMode: boolean = false;
  protected _boldMode: boolean = false;

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
   * The active quote theme for this builder class.
   *
   * Subclasses override this static to theme quoted indentation (e.g. the
   * rainbow palette). The instance getter {@link AbstractMsgBuilder.quoteTheme}
   * resolves to the theme declared on the concrete class, so a subclass
   * override is respected automatically.
   */
  static quoteTheme: QuoteTheme = { char: '▌', width: 1, palette: [] };

  /**
   * Returns the quote theme for the current class.
   */
  public get quoteTheme(): QuoteTheme {
    return (this.constructor as typeof AbstractMsgBuilder).quoteTheme;
  }

  /**
   * Resets the message builder to its initial state, clearing all message parts and data.
   *
   * @returns {this} The current instance for chaining.
   */
  public clear(): this {
    this._msgParts = [];
    this._data = undefined;
    this._dimMode = false;
    this._boldMode = false;
    return this;
  }

  /**
   * Indent every row after the first by `n` columns, when this message wraps.
   *
   * This is the wrap property a {@link TextBuilder} sets on a line. It has no
   * effect until a width is in force, and the `n` is added to the line's own
   * indent, so inside `indent()` a `wrap(16)` continuation starts at 18 columns.
   *
   * @param n - Columns of extra indentation for continuation rows. `0` clears it.
   * @returns {this} The current instance for chaining.
   */
  public wrap(n: Integer = 0): this {
    this._wrapIndent = Number.isInteger(n) && n > 0 ? n : undefined;
    // Called after a width was applied (the builder is chained at the end of a
    // line), the continuation indent has to reach the options format() reads.
    if (this._wrap !== undefined) {
      this._wrap = { ...this._wrap, indent: this._wrapIndent ?? 0 };
    }
    return this;
  }

  /**
   * Wrap this message instead of letting it run past the terminal.
   *
   * Called by {@link TextBuilder} when a width is in force, so `format()` can
   * break the message into rows without losing any part's styling.
   *
   * @param opts - The available width and the continuation indent. `undefined`
   *   turns wrapping off again.
   * @returns {this} The current instance for chaining.
   */
  public setWrap(opts: WrapOptions | undefined): this {
    this._wrap = opts;
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
      const count = countTabsAtBeginningOfString(String(args[0]));
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
    // Calculate effective allow based on parent conditions (if any)
    const parentAllows = this._allowStack.length === 0 || this._allowStack[this._allowStack.length - 1];
    const effectiveAllow = parentAllows && val;

    this._conditionMetStack.push(val);
    this._allowStack.push(effectiveAllow);
    return this;
  }

  public elif(val: boolean): this {
    if (this._conditionMetStack.length === 0) {
      throw new Error('elif() called without a matching if()');
    }

    const parentAllows = this._allowStack.length <= 1 || this._allowStack[this._allowStack.length - 2];
    const conditionMet = this._conditionMetStack[this._conditionMetStack.length - 1];

    if (conditionMet) {
      // A previous condition was met, so this branch should not execute
      this._allowStack[this._allowStack.length - 1] = false;
    } else {
      // No previous condition was met, check this one
      const effectiveAllow = parentAllows && val;
      this._allowStack[this._allowStack.length - 1] = effectiveAllow;
      if (val) {
        this._conditionMetStack[this._conditionMetStack.length - 1] = true;
      }
    }
    return this;
  }

  public else(): this {
    if (this._conditionMetStack.length === 0) {
      throw new Error('else() called without a matching if()');
    }

    const parentAllows = this._allowStack.length <= 1 || this._allowStack[this._allowStack.length - 2];
    const conditionMet = this._conditionMetStack[this._conditionMetStack.length - 1];

    if (conditionMet) {
      // A previous condition was met, so else branch should not execute
      this._allowStack[this._allowStack.length - 1] = false;
    } else {
      // No previous condition was met, execute else branch
      this._allowStack[this._allowStack.length - 1] = parentAllows;
      this._conditionMetStack[this._conditionMetStack.length - 1] = true;
    }
    return this;
  }

  public endif(): this {
    if (this._allowStack.length === 0) {
      throw new Error('endif() called without a matching if()');
    }
    this._allowStack.pop();
    this._conditionMetStack.pop();
    return this;
  }

  /**
   * Returns true if the current state allows adding content to the message.
   * This is true when there are no conditions or when all nested conditions are met.
   * @protected
   */
  protected get _allow(): boolean {
    if (this._allowStack.length === 0) {
      return true;
    }
    return this._allowStack[this._allowStack.length - 1];
  }

  /**
   * Appends a styled or unstyled part to the message.
   *
   * @param {string} str - The text content of the message part.
   * @param {StyleFormatterFn | null} [style] - An optional styling function.
   * @returns {this} The current instance for chaining.
   */
  appendMsgPart(str: string, style?: StyleFormatterFn | null): this {
    let finalStyle = style;
    if (this._dimMode) {
      const prev = finalStyle ?? ((s: string) => s);
      finalStyle = (s: string) => dim(prev(s));
    }
    if (this._boldMode) {
      const prev = finalStyle ?? ((s: string) => s);
      finalStyle = (s: string) => bold(prev(s));
    }
    const part: MsgPart = { str: str };
    if (finalStyle) {
      part.style = finalStyle;
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
    let finalStyle = style;
    if (this._dimMode) {
      const prev = finalStyle ?? ((s: string) => s);
      finalStyle = (s: string) => dim(prev(s));
    }
    if (this._boldMode) {
      const prev = finalStyle ?? ((s: string) => s);
      finalStyle = (s: string) => bold(prev(s));
    }
    const part: MsgPart = { str: str };
    if (finalStyle) {
      part.style = finalStyle;
    }
    this._msgParts.unshift(part);
    return this;
  }

  /**
   * Prepends a set of indentation levels to the beginning of the message.
   *
   * Each level becomes its own message part, preserving the level's style so
   * that it strips correctly under `color: false` formatting.
   *
   * @param {IndentLevel[]} levels - The indentation levels to prepend, in order.
   * @returns {this} The current instance for method chaining.
   */
  public prependIndent(levels: IndentLevel[]): this {
    if (levels.length > 0) {
      const parts: MsgPart[] = levels.map((level) => {
        const part: MsgPart = { str: level.str };
        if (level.style) {
          part.style = level.style;
        }
        return part;
      });
      this._msgParts = parts.concat(this._msgParts);
    }
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
  public stylize(style: Spec | null, ...args: StyleArg[]): this {
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
      const finalStyle: StyleFormatterFn | null = style ? toStyleFn(style) : null;
      this.appendMsgPart(str, finalStyle);
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
    if (_.isDict(data)) {
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
        elapsed: this._elapsed,
      };
      this._emitter.emit(entry);
      // Don't clear immediately - let the transport format first
      // this.clear();
      return entry;
    }
    return undefined;
  }

  /**
   * Emits the log message with elapsed wall time (EWT) since a mark was created.
   *
   * @remarks
   * This method calculates the elapsed time since a mark was created using the
   * logger's `mark()` method, appends the elapsed time to the message, and emits it.
   * The elapsed time is formatted with appropriate precision based on the duration.
   *
   * @param {string | number} mark - The mark identifier or timestamp to calculate elapsed time from.
   * @param {boolean} [keep=false] - Whether to keep the mark for future use.
   * @returns {EmitterData | undefined} The generated log entry if emitted, otherwise `undefined`.
   */
  public ewt(mark: string | number, keep = false): EmitterData | undefined {
    if (this._emitter && this._emitter.emitEnabled) {
      if (typeof mark === 'string' && this._emitter.demark) {
        // Use the emitter's demark method to get the elapsed time
        this._elapsed = this._emitter.demark(mark, keep);
      } else if (typeof mark === 'number') {
        // If mark is a number, treat it as a timestamp
        this._elapsed = performance.now() - mark;
      } else {
        // Fallback: treat string as a timestamp
        this._elapsed = performance.now() - parseFloat(mark as string);
      }

      // Format duration with appropriate precision
      /*       let digits = 3;
      if (elapsed > 100) {
        digits = 0;
      } else if (elapsed > 10) {
        digits = 1;
      } else if (elapsed > 1) {
        digits = 2;
      }

      // Add elapsed time to the message
      const elapsedStyle = this.getElapsedTimeStyle();
      this.appendMsgPart(` (${elapsed.toFixed(digits)} ms)`, elapsedStyle);
 */
      return this.emit();
    }
    return undefined;
  }

  /**
   * Override this method in subclasses to provide elapsed time styling.
   * @returns {StyleFormatterFn | undefined} The style formatter for elapsed time.
   */
  protected getElapsedTimeStyle(): StyleFormatterFn | undefined {
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
   * This method has been optimized for speed.
   *
   * @param {FormatOpts} [opts={}] - Formatting options.
   * @param {boolean} [opts.color] - Whether to apply color styling to the output. This will override system color (Deno.color).
   * @param {EmitterTarget} [opts.target] - The target output format ('console', 'json', or 'jsonArray').
   * @param {Integer} [opts.msgSep] - The number of spaces used to separate message parts. Defaults to 1.
   * @param {boolean} [opts.reset] - If set, resets the MsgBuilder state after formatting. Useful when multiple transports share the same formatted string.
   * @returns {string} The formatted log message string.
   */
  format(opts: FormatOpts = {}): string {
    const noColor = opts.color !== undefined ? !opts.color : Deno.noColor;

    let sep = ' ';
    if (typeof opts.msgSep === 'number' && opts.msgSep % 1 === 0) {
      const depth = opts.msgSep;
      sep = depth >= 0 && depth <= 16 ? SPACES_CACHE[depth] : ' '.repeat(depth);
    }

    // Note: an empty string '' is falsy
    const indent = this._msgIndent;
    const parts: string[] = indent ? [indent] : [];

    // OPTIMIZATION: Branch early based on noColor
    if (noColor) {
      // Fast path: No colors, no function checks, no closure allocations
      for (let i = 0; i < this._msgParts.length; i++) {
        parts.push(this._msgParts[i].str);
      }
    } else {
      // Slow path: Keep styling logic for local development
      for (let i = 0; i < this._msgParts.length; i++) {
        const part = this._msgParts[i];
        if (part.style && _.isFunction(part.style)) {
          parts.push(part.style(part.str));
        } else {
          parts.push(part.str);
        }
      }
    }

    if (opts.reset) this.clear();
    if (this._wrap !== undefined) {
      return this.wrapParts(parts, sep);
    }
    return parts.join(sep);
  }

  /**
   * Join the formatted parts into rows that fit the wrap width.
   *
   * A part is the smallest unit that moves: it is measured and placed whole, so
   * a styled part is never split and its escape sequences are never broken. A
   * part wider than the row is placed on a row of its own and allowed to
   * overflow, because there is nothing useful left to break.
   *
   * @param parts - The already-styled parts, the indent first when there is one.
   * @param sep - The separator between parts, normally a single space.
   * @returns The message as one string with rows joined by newlines.
   */
  protected wrapParts(parts: string[], sep: string): string {
    const wrap = this._wrap as WrapOptions;
    // TextBuilder hands over an indent one column short of the rendered one, to
    // cancel the space the first part gets before it. A continuation row has no
    // such part, so it pads by that same column and lands on the real indent.
    const lead = this._msgIndent;
    const cont = (lead.length > 0 ? lead + ' ' : '') + ' '.repeat(wrap.indent);

    // The parts are one continuous line: rows are broken at spaces, never at a
    // part boundary. Each word carries the gap in front of it, because between
    // parts the renderer joins with `sep` and inside a part the spaces are
    // literal, which is how a help screen aligns its columns.
    // A word's gap is the whitespace in front of it: literal spaces inside a
    // part (which is how an alignment column is built), or `sep` where the
    // renderer would have inserted it between two parts.
    const words: { text: string; width: number; gap: string }[] = [];
    /** Whitespace seen but not yet attached to a word. */
    let spaces = '';
    for (const raw of parts) {
      const plain = stripAnsi(raw);
      // The line indent is already at the start of the first row.
      if (words.length === 0 && spaces.length === 0 && raw === lead && lead.length > 0) {
        continue;
      }
      // Whitespace with no word after it belongs to the next word, which may be
      // in the following part. This is how a padded alignment column is built.
      if (plain.length > 0 && plain.trim().length === 0) {
        spaces += plain;
        continue;
      }
      // The rows are rebuilt from the rendered parts, so the words carry their
      // escape sequences: the style is put on once, before this runs, and must
      // survive to the output. Only the first and last word of a part have no
      // escape in the way, so splitting happens on the raw text and each piece
      // is measured with the escapes removed.
      for (const piece of raw.split(/(?<=\s)(?=\S)/)) {
        const text = piece.trimStart();
        spaces += piece.slice(0, piece.length - text.length);
        words.push({
          text: text.trimEnd(),
          width: visualLength(text),
          gap: words.length === 0 ? '' : spaces.length > 0 ? spaces : sep,
        });
        spaces = '';
      }
    }

    const rows: string[] = [];
    let row = lead;
    let rowWidth = visualLength(row);
    let empty = true;
    let gap = '';

    for (const word of words) {
      // The gap belongs to the word before it, since a break drops the gap and
      // starts the continuation at the wrap indent.
      gap = empty ? '' : word.gap;
      if (!empty && rowWidth + visualLength(gap) + word.width > wrap.width) {
        rows.push(row);
        row = cont;
        rowWidth = visualLength(row);
        empty = true;
        gap = '';
      }
      row += gap + word.text;
      rowWidth += visualLength(gap) + word.width;
      empty = false;
    }
    rows.push(row);
    return rows.join('\n');
  }

  /**
   * If you just want to output the message, and aren't using any of the logging support capabilities
   */
  log(): void {
    console.log(this.format());
  }
}
