import type * as Log from '$log';
import { DateTime } from '@epdoc/datetime';
import type * as Level from '@epdoc/loglevels';
import { LINE_TYPES } from '@epdoc/msgbuilder';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { type Integer, isDict, isFunction, isInteger, isPosInteger, isString, isStringArray } from '@epdoc/type';
import * as Base from '../base/mod.ts';

/**
 * Fallback bar glyph used when neither a `line`, `char`, nor theme glyph is set.
 */
const DEFAULT_QUOTE_CHAR = '▌';

/**
 * Returns true when `val` is a known {@link MsgBuilder.LineType} name.
 * @param {string} val - The candidate line type name.
 */
function isLineType(val: string): val is MsgBuilder.LineType {
  return Object.hasOwn(LINE_TYPES, val);
}

/**
 * A disposable indentation scope that automatically outdents when disposed.
 *
 * @remarks
 * This class enables the `using` pattern for automatic indentation management.
 * When used with `using`, the outdent happens automatically when the variable
 * goes out of scope, even if an error is thrown or an early return occurs.
 *
 * @example
 * ```typescript
 * {
 *   using _scope = logger.indentScope(2);
 *   logger.info.text('Task 1').emit();
 *   logger.info.text('Task 2').emit();
 * } // Automatically outdents here
 * ```
 */
export class DisposableIndent<M extends MsgBuilder.Abstract> implements Disposable {
  #logger: IndentLogger<M>;
  #levels: number;
  #disposed = false;

  constructor(logger: IndentLogger<M>, levels: number) {
    this.#logger = logger;
    this.#levels = levels;
  }

  /**
   * Disposes the indentation scope by calling outdent.
   * This method is called automatically when using the `using` declaration.
   */
  [Symbol.dispose](): void {
    if (!this.#disposed) {
      this.#logger.outdent(this.#levels);
      this.#disposed = true;
    }
  }
}

/**
 * A modifier accepted by {@link IndentLogger.quote}.
 *
 * - A `LineType` name (`'thin' | 'medium' | 'thick'`) selects a named bar.
 * - Any other `string` is treated as a literal bar glyph.
 * - A `StyleFormatterFn` overrides the palette color for the quote levels.
 * - A {@link MsgBuilder.QuoteOpts} object sets width, line, char, or style.
 */
export type QuoteMod = MsgBuilder.LineType | string | MsgBuilder.StyleFormatterFn | MsgBuilder.QuoteOpts;

/**
 * Options for emitting blank lines via {@link IndentLogger.blank}.
 */
export interface BlankOpts {
  /**
   * When `false`, emit a truly empty line even when indentation is active.
   * Defaults to `true`, which renders the current indentation gutter (leading
   * spaces and stripes) with no message content.
   */
  gutter?: boolean;
}

/**
 * Extends the {@link AbstractLogger} logger to provide indentation capabilities for log output.
 *
 * @remarks
 * This class allows for structured, hierarchical logging by prepending custom
 * indentation strings to log messages. It is particularly useful for visualizing
 * nested operations or code blocks in console output.
 *
 * @template M - The type of message builder used by the logger, conforming to
 * {@link MsgBuilder.Base.Builder}.
 * @implements {Logger.IIndent}
 */
export class IndentLogger<M extends MsgBuilder.Abstract> extends Base.Logger<M> {
  /**
   * The start time for time-based logging operations.
   * @protected
   */
  protected _t0: DateTime = DateTime.now();
  /**
   * An array of indentation levels.
   * Each level in the array is prepended to the log message.
   * @protected
   */
  protected _indent: MsgBuilder.IndentLevel[] = [];
  /**
   * The quote theme (bar glyph, width, and palette) resolved lazily from the
   * message builder on first use.
   * @protected
   */
  protected _quoteTheme: MsgBuilder.QuoteTheme | undefined;
  /**
   * The number of leading spaces reserved before the quote column.
   * @protected
   */
  protected _gutter: Integer = 0;
  protected override _msgSep: Integer | undefined = undefined;

  /**
   * Sets the message separator (number of spaces between message parts).
   * Set to `undefined` to reset to the default from `show.msgSep`.
   * @param {Integer | undefined} val - The number of spaces, or undefined to use the default.
   */
  override set msgSep(val: Integer | undefined) {
    this._msgSep = val;
  }

  /**
   * Retrieves the message separator value, or `undefined` if using the default.
   */
  override get msgSep(): Integer | undefined {
    return this._msgSep;
  }

  /**
   * Sets the start time for the logger's internal time tracking.
   *
   * @remarks
   * This method is typically used to override the default creation time of the
   * logger instance. Child loggers created via `getChild` will inherit their
   * parent's start time.
   *
   * @param {DateTime} d - The date to set as the start time.
   * @returns {this} The current logger instance for chaining.
   */
  startTime(d: DateTime): this {
    this._t0 = d;
    return this;
  }

  /**
   * Assigns properties from another `Indent` logger to this instance.
   * @internal
   */
  override assign(logger: IndentLogger<M>): void {
    super.assign(logger);
    this._t0 = logger._t0;
    this._indent = [...logger._indent];
    this._quoteTheme = logger._quoteTheme;
    this._gutter = logger._gutter;
  }

  /**
   * Creates a message builder with indentation applied.
   * This method wraps the LogMgr's getMsgBuilder to apply indentation.
   * @internal
   */
  protected getIndentedMsgBuilder(level: string): M {
    const msgBuilder = this._logMgr.getMsgBuilder(level, this);

    // Apply indentation if present
    if (this._indent.length > 0 || this._gutter > 0) {
      msgBuilder.prependIndent(this._prependLevels());
    }

    return msgBuilder;
  }

  /**
   * Returns a message builder for the specified log level.
   *
   * @remarks
   * This method provides dynamic level selection at runtime, allowing you to
   * choose the log level programmatically rather than using the level-specific
   * getters (e.g., `info`, `debug`, `verbose`).
   *
   * The level can be specified as:
   * - A `Level.Spec` object (with `name` and `severity`)
   * - A level name string (e.g., `'info'`, `'INFO'`, `'debug'`)
   * - A severity number (e.g., `9` for INFO)
   *
   * @param level - The log level as a Spec, name, or severity number
   * @returns A message builder configured for the specified level
   * @throws Error if the level is invalid or not found
   *
   * @example
   * ```typescript
   * const level = opts.level ?? this.ctx.logMgr.logLevels.asSpec('info');
   * this.at(level).text('Message').emit();
   * ```
   */
  public at(level?: Level.Spec | Level.Name | Level.Severity): M {
    const spec = this._logMgr.logLevels.asSpec(level ? level : 'info');
    if (!spec) {
      throw new Error(`Invalid log level: ${level}`);
    }
    return this.getIndentedMsgBuilder(spec.name);
  }

  /**
   * Emits a log entry, applying indentation for direct emit calls.
   * @param {Log.Entry} msg - The log entry to emit.
   */
  override emit(msg: Log.Entry): void {
    if (msg.msg && this._logMgr.transportMgr.meetsAnyThreshold(msg.level)) {
      // Apply indentation for direct emit calls
      if (this._indent.length > 0 || this._gutter > 0) {
        if (typeof msg.msg === 'string') {
          msg.msg = this._prefixString() + msg.msg;
        } else if (msg.msg && typeof msg.msg === 'object' && 'prependIndent' in msg.msg) {
          (msg.msg as unknown as { prependIndent: (levels: MsgBuilder.IndentLevel[]) => void }).prependIndent(
            this._prependLevels(),
          );
        }
      }
      this._logMgr.transportMgr.emit(msg);
    }
  }

  /**
   * Adds one or more plain indentation levels to the logger's output.
   *
   * @remarks
   * - If `n` is a `number`, that many space levels are added (or removed if negative).
   * - If `n` is a `string`, it is added directly as an indentation level.
   * - If `n` is an `array` of strings, each string is added as an indentation level.
   * - If `n` is `undefined`, a single space level is added.
   * - If `n` is `false`, indenting is turned off (same as {@link nodent}).
   *
   * For color-cycled bar levels, see {@link quote}. Both methods push onto the
   * same stack, so {@link outdent} (and its alias {@link unquote}) backs out the
   * most recent level regardless of which method created it.
   *
   * Automatically suppressed when progress is active (between start/stop) to prevent
   * interfering with progress indicator display.
   *
   * The return value can be used with the `using` declaration for automatic outdent
   * when the scope ends. This is the preferred way to manage indentation.
   *
   * @param {number | string | string[] | false} [n] - The indentation value(s) to add.
   * @returns {DisposableIndent<M>} A disposable object that outdents when disposed.
   *   Use with `using` for automatic cleanup, or ignore for manual outdent management.
   *
   * @example
   * ```typescript
   * // Using pattern (preferred) - automatic outdent
   * {
   *   using _scope = logger.indent();
   *   logger.info.text('Line 1').emit();
   *   logger.info.text('Line 2').emit();
   * } // Automatically outdents here
   *
   * // Manual management (legacy) - must call outdent()
   * logger.indent(2);
   * logger.info.text('Line 1').emit();
   * logger.outdent(2);
   * ```
   */
  indent(n?: number | string | string[] | false): DisposableIndent<M> {
    // Skip indent if progress is active to avoid disrupting progress display
    if (this._logMgr.transportMgr.hasActiveProgress) {
      // Return a no-op disposable that won't outdent anything
      return new DisposableIndent(this, 0);
    }

    let levelsAdded = 0;

    if (n === false) {
      this._indent = [];
    } else if (n === undefined) {
      this._indent.push({ str: ' ' });
      levelsAdded = 1;
    } else if (isString(n)) {
      this._indent.push({ str: n });
      levelsAdded = 1;
    } else if (isPosInteger(n)) {
      for (let x = 0; x < n; ++x) {
        this._indent.push({ str: ' ' });
      }
      levelsAdded = n;
    } else if (isInteger(n)) {
      // n is negative, remove |n| indent levels
      const levelsToRemove = Math.abs(n);
      for (let x = 0; x < levelsToRemove && this._indent.length > 0; ++x) {
        this._indent.pop();
      }
      levelsAdded = 0; // No levels to outdent for negative indents
    } else if (isStringArray(n)) {
      for (let x = 0; x < n.length; ++x) {
        this._indent.push({ str: n[x] });
      }
      levelsAdded = n.length;
    } else {
      this._indent.push({ str: ' ' });
      levelsAdded = 1;
    }

    return new DisposableIndent(this, levelsAdded);
  }

  /**
   * Retrieves the current array of indentation levels.
   * @internal
   */
  getdent(): MsgBuilder.IndentLevel[] {
    return this._indent;
  }

  /**
   * Adds one or more color-cycled bar (quote) levels to the logger's output.
   *
   * @remarks
   * Quote levels share the same stack as {@link indent}, so they can be
   * interleaved and are removed with {@link outdent} (or its alias
   * {@link unquote}). Each level renders a bar glyph colored from the active
   * quote theme palette by indentation depth.
   *
   * Accepted forms:
   * - `quote()` — one level with theme defaults.
   * - `quote(n)` — `n` levels.
   * - `quote('thick')` — a named {@link MsgBuilder.LineType} (or any other
   *   string, treated as a literal glyph).
   * - `quote(red)` — a style override.
   * - `quote(2, 'thick', red, { width: 2 })` — modifiers may be mixed freely.
   *
   * A {@link MsgBuilder.QuoteOpts} object may be passed anywhere among the
   * modifiers to set `width`, `line`, `char`, or `style`.
   *
   * Automatically suppressed when progress is active.
   *
   * @param {number | QuoteMod} [countOrMod] - The number of levels, or a modifier.
   * @param {...QuoteMod[]} mods - Additional modifiers.
   * @returns {DisposableIndent<M>} A disposable object that outdents when disposed.
   *
   * @example
   * ```typescript
   * logger.quote();                     // 1 rainbow bar
   * logger.quote(2);                    // 2 nested rainbow bars
   * logger.quote('thick');              // thick bar
   * logger.quote(2, 'thin', red);       // 2 thin red bars
   * logger.quote(1, { width: 2 });      // a 2-column bar
   * logger.unquote();                   // back out one bar
   * ```
   */
  quote(countOrMod?: number | QuoteMod, ...mods: QuoteMod[]): DisposableIndent<M> {
    // Skip quote if progress is active to avoid disrupting progress display
    if (this._logMgr.transportMgr.hasActiveProgress) {
      return new DisposableIndent(this, 0);
    }

    let count = 1;
    const allMods: QuoteMod[] = [];
    if (isInteger(countOrMod)) {
      count = countOrMod > 0 ? countOrMod : 0;
      allMods.push(...mods);
    } else if (countOrMod !== undefined) {
      allMods.push(countOrMod, ...mods);
    }

    const opts: MsgBuilder.QuoteOpts = {};
    for (const mod of allMods) {
      if (isFunction(mod)) {
        opts.style = mod as MsgBuilder.StyleFormatterFn;
      } else if (isString(mod)) {
        if (isLineType(mod)) {
          opts.line = mod;
        } else {
          opts.char = mod;
        }
      } else if (isDict(mod)) {
        Object.assign(opts, mod);
      }
    }

    for (let x = 0; x < count; ++x) {
      this._indent.push(this._quoteLevel(opts));
    }
    return new DisposableIndent(this, count);
  }

  /**
   * Reserves a number of leading columns before the stripe column.
   *
   * @remarks
   * Useful for aligning striped output with an icon or other leading column.
   * The gutter is applied to every indented line, including lines emitted by
   * {@link blank}.
   *
   * @param {Integer} [n=0] - The number of leading spaces to reserve.
   * @returns {this} The current logger instance for chaining.
   */
  gutter(n: Integer = 0): this {
    this._gutter = n < 0 ? 0 : n;
    return this;
  }

  /**
   * Emits one or more blank lines.
   *
   * @remarks
   * By default a blank line renders the current indentation gutter (leading
   * spaces and stripes) with no message content, which keeps the stripe column
   * visually continuous. When there is no active indentation, or when
   * `opts.gutter` is `false`, a truly empty line is emitted.
   *
   * @param {Integer} [count=1] - The number of blank lines to emit.
   * @param {BlankOpts} [opts] - Options controlling blank line rendering.
   * @returns {this} The current logger instance for chaining.
   */
  blank(count: Integer = 1, opts?: BlankOpts): this {
    if (this._logMgr.transportMgr.hasActiveProgress) {
      return this;
    }
    const level = this._logMgr.logLevels.defaultLevel;
    for (let x = 0; x < count; ++x) {
      const formatter = this._logMgr.getMsgBuilder(level.name, this);
      if (opts?.gutter !== false) {
        formatter.prependIndent(this._prependLevels());
      }
      this._logMgr.emit({ level, msg: formatter });
    }
    return this;
  }

  /**
   * Resolves the default quote theme from the message builder, caching it.
   * @returns {MsgBuilder.QuoteTheme} The active quote theme.
   * @protected
   */
  protected _resolveQuoteTheme(): MsgBuilder.QuoteTheme {
    if (!this._quoteTheme) {
      const builder = this._logMgr.getMsgBuilder(this._logMgr.logLevels.defaultLevel.name, this);
      this._quoteTheme = builder.quoteTheme;
    }
    return this._quoteTheme;
  }

  /**
   * Builds a single quote level from the resolved theme and per-call overrides.
   * @param {MsgBuilder.QuoteOpts} [opts] - Optional overrides for this level.
   * @returns {MsgBuilder.IndentLevel} The quote level.
   * @protected
   */
  protected _quoteLevel(opts?: MsgBuilder.QuoteOpts): MsgBuilder.IndentLevel {
    const theme = this._resolveQuoteTheme();
    const line = opts?.line ?? theme.line;
    const char = opts?.char ?? (line ? LINE_TYPES[line] : undefined) ?? theme.char ?? DEFAULT_QUOTE_CHAR;
    const width = opts?.width ?? theme.width ?? 1;
    const depth = this._indent.length;
    const palette = theme.palette ?? [];
    const style = opts?.style ?? (palette.length > 0 ? palette[depth % palette.length] : undefined);
    const str = width > 1 ? char.repeat(width) : char;
    return style ? { str, style } : { str };
  }

  /**
   * Builds the full indentation prefix, including the gutter.
   *
   * The gutter is prepended as a single space part, so it is joined like every
   * other level and applies automatically to indent, quote, and blank lines.
   *
   * @returns {MsgBuilder.IndentLevel[]} The indentation levels to prepend.
   * @protected
   */
  protected _prependLevels(): MsgBuilder.IndentLevel[] {
    const levels: MsgBuilder.IndentLevel[] = [];
    if (this._gutter > 0) {
      levels.push({ str: ' '.repeat(this._gutter) });
    }
    for (const level of this._indent) {
      levels.push(level);
    }
    return levels;
  }

  /**
   * Builds the indentation prefix as a plain string for direct string emits.
   * @returns {string} The indentation prefix.
   * @protected
   */
  protected _prefixString(): string {
    return this._prependLevels().map((level) => level.str).join(' ');
  }

  /**
   * Removes one or more levels of indentation.
   *
   * @param {number} [n=1] - The number of indentation levels to remove.
   * @returns {this} The current logger instance for chaining.
   *
   * Automatically suppressed when progress is active (between start/stop) to prevent
   * interfering with progress indicator display.
   *
   * @example
   * ```typescript
   * // Regular outdent - always applies
   * logger.outdent();
   * logger.outdent(2);
   *
   * // Outdent automatically suppressed during progress
   * logger.info.text('Building').start();
   * logger.outdent();  // No-op - progress is active
   * logger.info.text('Done').stop();
   * ```
   */
  outdent(n: number = 1): this {
    // Skip outdent if progress is active to avoid disrupting progress display
    if (this._logMgr.transportMgr.hasActiveProgress) {
      return this;
    }

    for (let x = 0; x < n; ++x) {
      if (this._indent.length > 0) {
        this._indent.pop();
      }
    }
    return this;
  }

  /**
   * Removes one or more levels of indentation. Alias for {@link outdent}, named
   * to read naturally after {@link quote}.
   *
   * @param {number} [n=1] - The number of levels to remove.
   * @returns {this} The current logger instance for chaining.
   *
   * @example
   * ```typescript
   * logger.quote(2);
   * logger.unquote(1); // back out one quote level
   * ```
   */
  unquote(n: number = 1): this {
    return this.outdent(n);
  }

  /**
   * Resets all indentation levels, effectively removing all current indentation.
   *
   * @remarks
   * This method is useful for ensuring that subsequent log messages start at
   * the very beginning of the line, regardless of previous indentation.
   *
   * @returns {this} The current logger instance for chaining.
   */
  nodent(): this {
    this._indent = [];
    return this;
  }

  /**
   * Sets the number of spaces between message parts for subsequent log messages.
   * Call with no argument to reset to the default from `show.msgSep`.
   * @param {Integer} [n] - The number of spaces, or omit to reset to the default.
   * @returns {this} The logger instance for chaining.
   */
  sep(n?: Integer): this {
    this.msgSep = n;
    return this;
  }
}
