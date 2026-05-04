import { DateTime } from '@epdoc/datetime';
import { _, type Integer } from '@epdoc/type';
import os from 'node:os';
import { relative } from 'node:path';
import { AbstractMsgBuilder } from '../abstract.ts';
import type * as MsgBuilder from '../types.ts';
import { consoleStyleFormatters } from './const.ts';
import type { ConsoleStyleMap, IConsoleErrOpts, IConsoleMsgBuilder } from './types.ts';

const home = os.userInfo().homedir;

const ARROWS = {
  // Line arrows (Standard)
  right: '→',
  left: '←',
  up: '↑',
  down: '↓',
  // Double-line arrows (Heavy/Emphasis)
  doubleRight: '⇒',
  doubleLeft: '⇐',
  doubleUp: '⇑',
  doubleDown: '⇓',
  // Solid triangles (Pointers)
  pRight: '▸',
  pLeft: '◂',
  pUp: '▴',
  pDown: '▾',
} as const;

type ArrowType = keyof typeof ARROWS;

/**
 * A message builder for creating styled console messages.
 *
 * @remarks
 * This class extends {@link AbstractMsgBuilder} to provide a fluent interface
 * for building complex, styled log messages. It supports various formatting
 * options including headers, labels, values, paths, icons, and error messages.
 *
 * ### Theming
 *
 * The active style map is held on the static `styleFormatters` property and
 * defaults to {@link consoleStyleFormatters}. You can swap themes globally or
 * per subclass:
 *
 * ```ts
 * // Global theme change
 * import { Console } from '@epdoc/msgbuilder';
 * Console.Builder.styleFormatters = Console.styleFormattersV2;
 *
 * // Per-subclass theme
 * class MyBuilder extends Console.Builder {
 *   static override styleFormatters = Console.styleFormattersV1;
 * }
 * ```
 *
 * Individual builder methods always read from `this.styles`, which resolves to
 * the class-level `styleFormatters` — so a subclass override is automatically
 * respected without overriding any methods.
 *
 * @example <caption>Basic logging</caption>
 * ```ts
 * import { Log } from '@epdoc/logger';
 *
 * const log = new Log.Mgr().getLogger();
 * log.info.h1('Hello').text('World').emit();
 * ```
 *
 * @example <caption>Standalone usage</caption>
 * ```ts
 * import { Console } from '@epdoc/msgbuilder';
 *
 * const builder = new Console.Builder();
 * const str = builder.h1('Standalone').value(123).format({ color: false });
 * // str === 'Standalone 123'
 * ```
 */
export class ConsoleMsgBuilder extends AbstractMsgBuilder implements IConsoleMsgBuilder {
  /**
   * The active style map for this class.
   *
   * Assign a different {@link ConsoleStyleMap} here to change the theme for
   * all instances of this class (or its subclasses, unless they declare their
   * own `static styleFormatters`).
   *
   * @example
   * ```ts
   * import { Console } from '@epdoc/msgbuilder';
   * Console.Builder.styleFormatters = Console.styleFormattersV2;
   * ```
   */
  static styleFormatters: ConsoleStyleMap = consoleStyleFormatters;

  protected _nextPartPluralize: boolean | undefined;

  /**
   * Returns the style map for the current class.
   *
   * Reading via `this.constructor` ensures subclasses that declare their own
   * `static styleFormatters` use their own theme without overriding any
   * instance methods.
   */
  protected get styles(): ConsoleStyleMap {
    return (this.constructor as typeof ConsoleMsgBuilder).styleFormatters;
  }

  /**
   * Returns the style formatter used for elapsed-time display.
   * @returns {MsgBuilder.StyleFormatterFn} The dim style formatter.
   */
  protected override getElapsedTimeStyle(): MsgBuilder.StyleFormatterFn {
    return this.styles.dim;
  }

  /**
   * Factory method for creating a new {@link ConsoleMsgBuilder} instance.
   * @param {MsgBuilder.IEmitter} emitter - The log emitter.
   * @returns {ConsoleMsgBuilder} A new instance.
   */
  static create(emitter: MsgBuilder.IEmitter): ConsoleMsgBuilder {
    return new ConsoleMsgBuilder(emitter);
  }

  // ─── Text hierarchy ────────────────────────────────────────────────────────

  /**
   * Appends styled body text to the message.
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public text(...args: MsgBuilder.StyleArg[]): this {
    const processedArgs = this._applyPluralization(args);
    return this.stylize(this.styles.text, ...processedArgs);
  }

  /**
   * Appends a top-level heading (h1) to the message.
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public h1(...args: MsgBuilder.StyleArg[]): this {
    const processedArgs = this._applyPluralization(args);
    return this.stylize(this.styles.h1, ...processedArgs);
  }

  /**
   * Appends a secondary heading (h2) to the message.
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public h2(...args: MsgBuilder.StyleArg[]): this {
    const processedArgs = this._applyPluralization(args);
    return this.stylize(this.styles.h2, ...processedArgs);
  }

  /**
   * Appends a tertiary heading (h3) to the message.
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public h3(...args: MsgBuilder.StyleArg[]): this {
    const processedArgs = this._applyPluralization(args);
    return this.stylize(this.styles.h3, ...processedArgs);
  }

  // ─── Semantic styles ───────────────────────────────────────────────────────

  /**
   * Appends an action-styled message (e.g. a verb or command).
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public action(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(this.styles.action, ...args);
  }

  /**
   * Appends a label-styled message (e.g. a key name).
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public label(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(this.styles.label, ...args);
  }

  /**
   * Appends a highlighted (emphasized) message.
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public highlight(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(this.styles.highlight, ...args);
  }

  /**
   * Appends a value-styled message.
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public value(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(this.styles.value, ...args);
  }

  /**
   * Dim mode control or dim styling.
   *
   * - `dim()`: Toggle persistent dim mode (on↔off)
   * - `dim(true)`: Enable persistent dim mode for all subsequent output
   * - `dim(false)`: Disable persistent dim mode
   * - `dim('text')` or `dim(value, ...)`: Apply dim styling to text only (one-time)
   *
   * @param {boolean | MsgBuilder.StyleArg} firstArg - Toggle/enable/disable flag or text to style
   * @param {...MsgBuilder.StyleArg[]} restArgs - Additional text arguments (when styling)
   * @returns {this}
   */
  public dim(firstArg?: boolean | MsgBuilder.StyleArg, ...restArgs: MsgBuilder.StyleArg[]): this {
    if (typeof firstArg === 'boolean') {
      this._dimMode = firstArg;
      return this;
    } else if (firstArg === undefined) {
      this._dimMode = !this._dimMode;
      return this;
    } else {
      const args = [firstArg, ...restArgs];
      return this.stylize(this.styles.dim, ...args);
    }
  }

  /**
   * Disable persistent dim mode.
   * Alias for `dim(false)`.
   *
   * @returns {this}
   */
  public undim(): this {
    this._dimMode = false;
    return this;
  }

  /**
   * Bold mode control or bold styling.
   *
   * - `bold()`: Toggle persistent bold mode (on↔off)
   * - `bold(true)`: Enable persistent bold mode for all subsequent output
   * - `bold(false)`: Disable persistent bold mode
   * - `bold('text')` or `bold(value, ...)`: Apply bold styling to text only (one-time)
   *
   * @param {boolean | MsgBuilder.StyleArg} firstArg - Toggle/enable/disable flag or text to style
   * @param {...MsgBuilder.StyleArg[]} restArgs - Additional text arguments (when styling)
   * @returns {this}
   */
  public bold(firstArg?: boolean | MsgBuilder.StyleArg, ...restArgs: MsgBuilder.StyleArg[]): this {
    if (typeof firstArg === 'boolean') {
      this._boldMode = firstArg;
      return this;
    } else if (firstArg === undefined) {
      this._boldMode = !this._boldMode;
      return this;
    } else {
      const args = [firstArg, ...restArgs];
      return this.stylize(this.styles.bold, ...args);
    }
  }

  /**
   * Disable persistent bold mode.
   * Alias for `bold(false)`.
   *
   * @returns {this}
   */
  public unbold(): this {
    this._boldMode = false;
    return this;
  }

  // ─── Navigation / references ───────────────────────────────────────────────

  /**
   * Appends a path-styled message. Use for file paths or filenames.
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public path(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(this.styles.path, ...args);
  }

  /**
   * Appends a URL-styled message.
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public url(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(this.styles.url, ...args);
  }

  /**
   * TODO: Update this jsdoc
   * Formats a file path as a relative path, preferring the shorter of home-relative or CWD-relative.
   *
   * This method always returns a relative path (never absolute), choosing whichever is shorter:
   * - Home-relative (`~/...`) if the path relative to the user's home directory is shorter
   * - CWD-relative (`./...`) if the path relative to the current working directory is shorter
   *
   * Unlike typical relative path functions, this method will show paths with `..` traversal
   * if necessary. For example, `/usr/bin` might be displayed as `~/../../usr/bin` on macOS
   * where the home directory is `/Users/username`.
   *
   * @param path - The absolute or relative file path to format
   * @param {string} [relativeTo] - The path to make the path relative to. Defaults to 'home'.
   * @param {string} [prefix] - The prefix to prepend to the relative path. Defaults to './' if not home or cwd.
   * @returns The current instance for method chaining
   *
   * @example Basic usage with paths under home
   * ```typescript
   * const builder = new Console.Builder();
   * // If home is /Users/alice and cwd is /Users/alice/projects
   * builder.relative('/Users/alice/documents/file.txt');
   * // Displays as: ~/documents/file.txt
   * ```
   *
   * @example Paths outside home and cwd
   * ```typescript
   * const builder = new Console.Builder();
   * // If home is /Users/alice
   * builder.relative('/usr/local/bin');
   * // Displays as: ~/../../usr/local/bin (or ./../../usr/local/bin if CWD-relative is shorter)
   * ```
   *
   * @example CWD-relative when shorter
   * ```typescript
   * const builder = new Console.Builder();
   * // If home is /Users/alice and cwd is /usr/local
   * builder.relative('/usr/local/bin/app');
   * // Displays as: ./bin/app (shorter than ~/../../usr/local/bin/app)
   * ```
   */
  relative(path: string | { path: string }, relativeTo?: string | 'home' | 'cwd', prefix?: string): this {
    const p = _.isString(path)
      ? path
      : (_.isObject(path) && 'path' in path && _.isString(path.path))
      ? path.path
      : undefined;
    if (!_.isString(p)) {
      return this.path('?');
    }
    let displayPath: string;
    if (relativeTo === 'home') {
      displayPath = `~/${relative(home, p)}`;
    } else if (relativeTo === 'cwd') {
      displayPath = `./${relative(Deno.cwd(), p)}`;
    } else if (_.isString(relativeTo) && prefix) {
      const p2 = `${prefix}:/` || './';
      displayPath = `${p}${relative(relativeTo, p2)}`;
    } else {
      displayPath = `~/${relative(home, p)}`;
    }
    return this.path(displayPath);
  }

  // ─── Data types ────────────────────────────────────────────────────────────

  /**
   * Appends a date-styled message. Accepts Date, DateTime, Temporal.Instant,
   * Temporal.ZonedDateTime, or Temporal.PlainDateTime objects. Falls back to
   * treating the first argument as a plain string if not a date-like object.
   *
   * Uses the 'yyyy-MM-dd HH:mm:ss' format and 'local' timezone by default.
   *
   * @param date - The date to format (Date, DateTime, or Temporal object)
   * @param format - Optional format string (e.g., 'yyyy-MM-dd HH:mm:ss')
   * @returns {this}
   *
   * @example
   * ```typescript
   * // Simple usage with default format
   * msg.date(new Date());
   *
   * // With custom format
   * msg.date(new Date(), 'yyyy-MM-dd');
   *
   * // With DateTime object
   * msg.date(DateTime.from('2024-03-15T10:30:00Z'));
   *
   * // With timezone override via options
   * msg.date(someDate, { format: 'HH:mm', tz: 'utc' });
   *
   * // Fallback to string (backward compatibility)
   * msg.date('2024-03-15');
   * ```
   */
  public date(date: DateTime, format?: string): this;
  public date(date: DateTime, options: { format?: string; tz?: 'local' | 'utc' | string }): this;
  public date(...args: MsgBuilder.StyleArg[]): this;
  public date(...args: MsgBuilder.StyleArg[]): this {
    if (args.length === 0) {
      return this.stylize(this.styles.date, ...args);
    }

    const firstArg = args[0];
    if (!DateTime.isDateLike(firstArg)) {
      return this.stylize(this.styles.date, ...args);
    }

    // Default options
    let format = 'yyyy-MM-dd HH:mm:ss';
    let tz: 'local' | 'utc' | string = 'local';

    // Parse second argument
    if (args.length >= 2) {
      const secondArg = args[1];
      if (_.isString(secondArg)) {
        format = secondArg;
      } else if (_.isObject(secondArg) && !Array.isArray(secondArg)) {
        const opts = secondArg as { format?: string; tz?: 'local' | 'utc' | string };
        if (opts.format !== undefined) {
          format = opts.format;
        }
        if (opts.tz !== undefined) {
          tz = opts.tz;
        }
      }
    }

    // Convert to DateTime and format
    const dt = DateTime.from(firstArg);
    if (dt.isNearMax()) return this.stylize(this.styles.date, 'distant future');
    if (dt.isNearMin()) return this.stylize(this.styles.date, 'distant past');
    const formatted = dt.withTz(tz as Parameters<DateTime['withTz']>[0]).format(format);
    return this.stylize(this.styles.date, formatted);
  }

  /**
   * Appends a code-styled message. Use for inline code snippets or identifiers.
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public code(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(this.styles.code, ...args);
  }

  // ─── Status ────────────────────────────────────────────────────────────────

  /**
   * Appends a warning-styled message.
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public warn(...args: MsgBuilder.StyleArg[]): this {
    return this._allow ? this.stylize(this.styles.warn, ...args) : this;
  }

  /**
   * Appends an error-styled message.
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public error(...args: MsgBuilder.StyleArg[]): this {
    return this._allow ? this.stylize(this.styles.error, ...args) : this;
  }

  /**
   * Appends a success-styled message.
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public success(...args: MsgBuilder.StyleArg[]): this {
    return this._allow ? this.stylize(this.styles.success, ...args) : this;
  }

  /**
   * Appends a strikethrough-styled message.
   * @param {...MsgBuilder.StyleArg[]} args
   * @returns {this}
   */
  public strikethru(...args: MsgBuilder.StyleArg[]): this {
    return this._allow ? this.stylize(this.styles.strikethru, ...args) : this;
  }

  // ─── Icon methods ──────────────────────────────────────────────────────────

  /**
   * Appends a boolean icon (✓ or ✗). Defaults to `success` style.
   * @param {boolean} b - The boolean value.
   * @param {MsgBuilder.StyleFormatterFn} [color] - Optional style override.
   * @returns {this}
   */
  public ibool(b: boolean, color?: MsgBuilder.StyleFormatterFn): this {
    if (b) {
      return this.icheck(color);
    } else {
      return this.ierror(color);
    }
  }
  public iboolb(b: boolean, color?: MsgBuilder.StyleFormatterFn): this {
    if (b) {
      return this.icheckb(color);
    } else {
      return this.ierrorb(color);
    }
  }

  /**
   * Appends a checkmark icon (✓). Defaults to `success` style.
   * @param {MsgBuilder.StyleFormatterFn} [color] - Optional style override.
   * @returns {this}
   */
  public icheck(color?: MsgBuilder.StyleFormatterFn): this {
    return this.stylize(color ?? this.styles.success, '✓');
  }

  public icheckb(color?: MsgBuilder.StyleFormatterFn): this {
    return this.stylize(color ?? this.styles.success, '✔');
  }

  /**
   * Appends a warning icon (⚠). Defaults to `warn` style.
   * @param {MsgBuilder.StyleFormatterFn} [color] - Optional style override.
   * @returns {this}
   */
  public ialert(color?: MsgBuilder.StyleFormatterFn): this {
    return this.stylize(color ?? this.styles.warn, '⚠');
  }

  /**
   * Appends a cross icon (✗). Defaults to `error` style.
   * @param {MsgBuilder.StyleFormatterFn} [color] - Optional style override.
   * @returns {this}
   */
  public ierror(color?: MsgBuilder.StyleFormatterFn): this {
    return this.stylize(color ?? this.styles.error, '✗');
  }
  public ierrorb(color?: MsgBuilder.StyleFormatterFn): this {
    return this.stylize(color ?? this.styles.error, '✘');
  }

  /**
   * Appends a bullet icon (•). Defaults to `text` style.
   * @param {MsgBuilder.StyleFormatterFn} [color] - Optional style override.
   * @returns {this}
   */
  public iinfo(color?: MsgBuilder.StyleFormatterFn): this {
    return this.stylize(color ?? this.styles.text, 'ℹ');
  }

  /**
   * Appends a bullet icon (•). Defaults to `text` style.
   * @param {MsgBuilder.StyleFormatterFn} [color] - Optional style override.
   * @returns {this}
   */
  public iplay(color?: MsgBuilder.StyleFormatterFn): this {
    return this.stylize(color ?? this.styles.text, '▶');
  }

  /**
   * Appends a bullet icon (•). Defaults to `text` style.
   * @param {MsgBuilder.StyleFormatterFn} [color] - Optional style override.
   * @returns {this}
   */
  public ibullet(color?: MsgBuilder.StyleFormatterFn): this {
    return this.stylize(color ?? this.styles.text, '•');
  }

  /**
   * Appends an elipse character. Defaults to `text` style.
   * @param {MsgBuilder.StyleFormatterFn} [color] - Optional style override.
   * @returns {this}
   */
  public iellipsis(color?: MsgBuilder.StyleFormatterFn): this {
    return this.stylize(color ?? this.styles.text, '…');
  }

  /**
   * Appends three dots. Defaults to `text` style.
   * @param {MsgBuilder.StyleFormatterFn} [color] - Optional style override.
   * @returns {this}
   */
  public ellipsis(color?: MsgBuilder.StyleFormatterFn): this {
    return this.stylize(color ?? this.styles.text, '...');
  }

  /**
   * Appends a generic icon character.
   *
   * @param {string} char - The icon character to display.
   * @param {MsgBuilder.StyleFormatterFn} [color] - Optional style override (defaults to `text` style).
   * @returns {this}
   *
   * @example
   * ```ts
   * log.info.icon('→').text('Next step').emit();
   * log.info.icon('★', this.styles.highlight).text('Featured').emit();
   * ```
   */
  public icon(char: string, color?: MsgBuilder.StyleFormatterFn): this {
    return this.stylize(color ?? this.styles.text, char);
  }

  /**
   * Appends an arrow icon.
   * @param type Or color if using default right arrow.
   * @param color Optional style override.
   */
  public iarrow(type?: ArrowType | MsgBuilder.StyleFormatterFn, color?: MsgBuilder.StyleFormatterFn): this {
    let char: string = ARROWS.right;
    let style = color;

    if (_.isString(type) && type in ARROWS) {
      char = ARROWS[type as ArrowType];
    } else if (_.isFunction(type)) {
      style = type;
    }
    return this.stylize(style ?? this.styles.text, char);
  }

  /**
   * Appends a star icon (★). Defaults to `highlight` style.
   * @param {MsgBuilder.StyleFormatterFn} [color] - Optional style override.
   * @returns {this}
   */
  public istar(color?: MsgBuilder.StyleFormatterFn): this {
    return this.stylize(color ?? this.styles.highlight, '★');
  }

  public spaces(count: Integer): this {
    return this.text(' '.repeat(count));
  }

  // ─── Composite helpers ─────────────────────────────────────────────────────

  /**
   * Sets a pluralization flag for the next chained method and outputs the
   * provided number with `value` styling.
   *
   * If the next chained method receives one string argument, an `'s'` suffix
   * is added when `num !== 1`. If it receives two string arguments, the first
   * is used for singular and the second for plural.
   *
   * @param {Integer} num - The number to display.
   * @returns {this}
   *
   * @example
   * ```ts
   * log.info.text('Found').count(activities.length).text('activity', 'activities').emit();
   * ```
   */
  public count(num: Integer): this {
    super.stylize(this.styles.value, num);
    this._nextPartPluralize = _.isInteger(num) ? num !== 1 : undefined;
    return this;
  }

  /**
   * Appends a horizontal section divider with an optional title.
   * @param {string} [str] - The section title.
   * @returns {this}
   */
  public section(str?: string): this {
    if (!this._allow) return this;
    if (_.isNonEmptyString(str)) {
      const len = (80 - str.length - 2) / 2;
      if (len < 0) {
        return this.h1('-'.repeat(2) + ' ' + str + ' ' + '-'.repeat(2));
      }
      return this.h1('-'.repeat(Math.floor(len)) + ' ' + str + ' ' + '-'.repeat(Math.ceil(len)));
    } else {
      return this.h1('-'.repeat(80));
    }
  }

  /**
   * Appends a formatted error message.
   *
   * If `error` is not an `Error` instance it will be coerced into one.
   *
   * @param {unknown} error - The error object or value to log.
   * @param {IConsoleErrOpts} [opts={}] - Formatting options.
   * @param {boolean} [opts.code=false] - Include the error `code` property if present.
   * @param {boolean} [opts.cause=true] - Include the error `cause` if present.
   * @param {boolean} [opts.path=true] - Include the error `path` if present.
   * @param {boolean} [opts.stack=false] - Include the stack trace (overrides `emitter.stackEnabled` when `true`).
   * @returns {this}
   */
  public err(error: unknown, opts: IConsoleErrOpts = {}): this {
    if (!this._allow) return this;
    const err = _.asError(error);
    this.error(err.message);
    if (opts.code === true && 'code' in err) {
      this.label('code:').value((err as { code: string | number }).code);
    }
    if (opts.cause !== false && 'cause' in err) {
      this.label('cause:').value(err.cause);
    }
    if (opts.path !== false && 'path' in err) {
      this.relative(err as { path: string }, 'home');
    }
    if (opts.stack !== false && (this._emitter.stackEnabled || opts.stack === true)) {
      this.text('\n' + err.stack);
    }
    return this;
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  /**
   * Applies pluralization to the given arguments based on the `_nextPartPluralize` flag.
   *
   * Consumes and resets the flag after use.
   *
   * @param {MsgBuilder.StyleArg[]} args
   * @returns {MsgBuilder.StyleArg[]}
   * @protected
   */
  protected _applyPluralization(args: MsgBuilder.StyleArg[]): MsgBuilder.StyleArg[] {
    if (this._nextPartPluralize === undefined) {
      return args;
    }

    const isPlural = this._nextPartPluralize;
    this._nextPartPluralize = undefined;

    if (args.length === 1 && _.isNonEmptyString(args[0])) {
      const originalStr = String(args[0]);
      return [isPlural ? originalStr + 's' : originalStr];
    } else if (args.length === 2 && _.isNonEmptyString(args[0]) && _.isNonEmptyString(args[1])) {
      return [isPlural ? String(args[1]) : String(args[0])];
    }
    return args;
  }
}
