import { asError, type Integer, isInteger, isNonEmptyString, isPosNumber } from '@epdoc/type';
import * as colors from '@std/fmt/colors';
import os from 'node:os'; // Used for homedir in `relative`
import { relative } from 'node:path';
import type { Level } from '../levels/index.ts';
import type * as Logger from '../logger/types.ts';
import type * as Log from '../types.ts';
import { Base } from './base.ts';
import type * as MsgBuilder from './types.ts';

const home = os.userInfo().homedir;

const styleFormatters: Record<string, MsgBuilder.StyleFormatterFn> = {
  text: colors.brightWhite,
  h1: (str: string) => colors.bold(colors.magenta(str)),
  h2: colors.magenta,
  h3: colors.yellow,
  action: (str: string) => colors.black(colors.bgYellow(str)),
  label: colors.blue,
  highlight: colors.brightMagenta,
  value: colors.green,
  path: (str: string) => colors.underline(colors.gray(str)),
  date: colors.brightCyan,
  warn: colors.brightYellow,
  error: (str: string) => colors.bold(colors.brightRed(str)),
  strikethru: colors.inverse,
  _reqId: colors.brightYellow,
  _sid: (str: string) => colors.underline(colors.yellow(str)),
  _package: colors.green,
  _action: colors.blue,
  _plain: colors.white,
  _suffix: colors.white,
  _elapsed: colors.white,
  _level: colors.gray,
  _source: colors.gray,
  _errorPrefix: colors.red,
  _warnPrefix: colors.cyan,
  _infoPrefix: colors.gray,
  _verbosePrefix: colors.gray,
  _debugPrefix: colors.gray,
  _sillyPrefix: colors.gray,
  _httpPrefix: colors.gray,
  _timePrefix: colors.gray,
} as const;

export interface IConsole {
  text(...args: MsgBuilder.StyleArg[]): this;
  h1(...args: MsgBuilder.StyleArg[]): this;
  h2(...args: MsgBuilder.StyleArg[]): this;
  h3(...args: MsgBuilder.StyleArg[]): this;
  action(...args: MsgBuilder.StyleArg[]): this;
  label(...args: MsgBuilder.StyleArg[]): this;
  highlight(...args: MsgBuilder.StyleArg[]): this;
  value(...args: MsgBuilder.StyleArg[]): this;
  path(...args: MsgBuilder.StyleArg[]): this;
  relative(path: string): this;
  date(...args: MsgBuilder.StyleArg[]): this;
  section(str: string): this;
  err(error: unknown, opts: ErrOpts): this;
  warn(...args: MsgBuilder.StyleArg[]): this;
  error(...args: MsgBuilder.StyleArg[]): this;
  strikethru(...args: MsgBuilder.StyleArg[]): this;
}

export type ErrOpts = Partial<{
  code: boolean;
  cause: boolean;
  path: boolean;
  stack: boolean;
}>;

/**
 * Message Builder class for styling messages. Extends the CoreMsgBuilder to
 * provide custom formatting using chained messages. If you prefer to declare
 * and use a custom set of formatting metchods, declare your own MsgBuilder and
 * pass it to the LogManager.
 */
export class Console extends Base implements IConsole, MsgBuilder.IEmitDuration {
  static readonly styleFormatters = styleFormatters;
  protected _nextPartPluralize: boolean | undefined; // true for plural, false for singular, undefined for no effect

  static override factoryMethod(
    level: Level.Name,
    emitter: Logger.IEmitter,
    meetsThreshold: boolean = true
  ): Console {
    return new Console(level, emitter, meetsThreshold);
  }

  /**
   * Emits a styled text message.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public text(...args: MsgBuilder.StyleArg[]): this {
    const processedArgs = this._applyPluralization(args);
    return this.stylize(styleFormatters.text, ...processedArgs);
  }
  /**
   * Emits a styled h1 message.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public h1(...args: MsgBuilder.StyleArg[]): this {
    const processedArgs = this._applyPluralization(args);
    return this.stylize(styleFormatters.h1, ...processedArgs);
  }
  /**
   * Emits a styled h2 message.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public h2(...args: MsgBuilder.StyleArg[]): this {
    const processedArgs = this._applyPluralization(args);
    return this.stylize(styleFormatters.h2, ...processedArgs);
  }

  /**
   * Emits a styled h3 message.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public h3(...args: MsgBuilder.StyleArg[]): this {
    const processedArgs = this._applyPluralization(args);
    return this.stylize(styleFormatters.h3, ...processedArgs);
  }

  /**
   * Emits a styled action message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public action(...args: MsgBuilder.StyleArg[]): this {
    // Action is not typically pluralized based on a count, so no _applyPluralization here.
    return this.stylize(styleFormatters.action, ...args);
  }

  /**
   * Sets a flag for the next chained method to apply pluralization logic,
   * and outputs the provided number with 'value' styling.
   * @param num - The number to display and use for pluralization determination.
   * @returns The current instance for method chaining.
   */
  public count(num: Integer): this {
    // First, output the number itself using the base stylize method.
    // This ensures the number itself is not subject to pluralization logic.
    super.stylize(styleFormatters.value, num);

    // Now, set the flag for the *next* chained method.
    this._nextPartPluralize = isInteger(num) ? num !== 1 : undefined;
    return this;
  }

  /**
   * Emits a styled label message.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public label(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.label, ...args);
  }

  /**
   * Emits a styled highlight message.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public highlight(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.highlight, ...args);
  }

  /**
   * Emits a styled value message.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public value(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.value, ...args);
  }

  /**
   * Emits a styled path message. Use for displaying file paths or filenames.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public path(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.path, ...args);
  }

  /**
   * Emits a styled file or folder path, displaying the path relative to the
   * user's home directory. Use for displaying file paths or filenames.
   * @param {string} path - The path to be stylized.
   * @returns {this} The current instance for method chaining.
   */
  relative(path: string): this {
    const s = '~/' + relative(home, path);
    return this.path(s);
  }

  /**
   * Emits a styled date message. XXX add more info
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public date(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.date, ...args);
  }

  /**
   * Emits a section delimiter with an optinoal title
   * @param {string} str - The title.
   * @returns {this} The current instance for method chaining.
   */
  section(str: string = ''): this {
    const len = (80 - str.length - 2) / 2;
    return this.h1('-'.repeat(Math.floor(len)) + ' ' + str + ' ' + '-'.repeat(Math.ceil(len)));
  }

  /**
   * Emits a message for an Error object. If error is not an error object, it is
   * converted to one.
   * @param {Error|unknown} error - The error object, or string
   * @param {boolean} opts.stack - Set opts.stack true to always display the error stack,
   * false to never display, otherwise it is diplayed if the stack threshold is
   * met.
   * @param {boolean} opts.code - Set to true to display err.code (default false)
   * @param {boolean} opts.cause - Set to false to not display err.cause (default true)
   * @param {boolean} opts.path - Set to false to not display err.path (default true)
   * @returns {this} The current instance for method chaining.
   */
  err(error: unknown, opts: ErrOpts = {}): this {
    const err = asError(error);
    this.error(err.message);
    if (opts.code === true && 'code' in err) {
      this.label('code:').value((err as { code: string | number }).code);
    }
    if (opts.cause !== false && 'cause' in err) {
      this.label('cause:').value(err.cause);
    }
    if (opts.path !== false && 'path' in err) {
      this.relative((err as { path: string }).path);
    }
    if (opts.stack !== false && (this._meetsThreshold || opts.stack === true)) {
      this.text('\n' + err.stack);
    }
    return this;
  }

  /**
   * Emits a styled warning message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public warn(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.warn, ...args);
  }
  /**
   * Emits a styled error message.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public error(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.error, ...args);
  }

  /**
   * Emits a styled strikethru message.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public strikethru(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.strikethru, ...args);
  }

  /**
   * Helper method to apply pluralization logic based on the `_nextPartPluralize` flag.
   * This method consumes the flag.
   * @param args - The original arguments passed to a styling method.
   * @returns The potentially modified arguments after applying pluralization.
   * @protected
   */
  protected _applyPluralization(args: MsgBuilder.StyleArg[]): MsgBuilder.StyleArg[] {
    if (this._nextPartPluralize === undefined) {
      return args; // No pluralization context
    }

    const isPlural = this._nextPartPluralize;
    this._nextPartPluralize = undefined; // Consume and reset the flag for the next call

    if (args.length === 1 && isNonEmptyString(args[0])) {
      const originalStr = String(args[0]);
      return [isPlural ? originalStr + 's' : originalStr];
    } else if (args.length === 2 && isNonEmptyString(args[0]) && isNonEmptyString(args[1])) {
      return [isPlural ? String(args[1]) : String(args[0])];
    }
    return args; // No pluralization applied for other arg patterns or non-string args
  }

  /**
   * @param duration
   * @returns
   */
  emitWithTime(duration: number | string): Log.Entry | undefined {
    return this.ewt(duration);
  }

  /**
   * Emits a message with the elapsed time since the last mark. If a duration is
   * provided, it will be used; otherwise, the duration is calculated from the
   * last mark to the current time.
   *
   * @param duration - The time duration in milliseconds. If not provided, it
   *                  defaults to the time elapsed since the last mark. If a
   *                  string it looks for the corresponding mark that was set
   *                  with the mark method.
   * @returns A formatted string representing the elapsed time.
   */
  ewt(duration: number | string, keep = false): Log.Entry | undefined {
    if (this._meetsThreshold) {
      if (isNonEmptyString(duration)) {
        duration = this._emitter.demark(duration, keep);
      }
      if (isPosNumber(duration)) {
        let digits: Integer = 3;
        if (duration > 100) {
          digits = 0;
        } else if (duration > 10) {
          digits = 1;
        } else if (duration > 1) {
          digits = 2;
        }
        return this.stylize(styleFormatters._elapsed, `(${duration.toFixed(digits)} ms response)`).emit();
      }
      return this.emit();
    }
  }
}
