import { type Integer, isNonEmptyString, isPosNumber } from '@epdoc/type';
import * as colors from '@std/fmt/colors';
import type { Level } from '../levels/index.ts';
import type * as Logger from '../logger/types.ts';
import type * as Log from '../types.ts';
import { Base } from './base.ts';
import type * as MsgBuilder from './types.ts';

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
  date(...args: MsgBuilder.StyleArg[]): this;
  warn(...args: MsgBuilder.StyleArg[]): this;
  error(...args: MsgBuilder.StyleArg[]): this;
  strikethru(...args: MsgBuilder.StyleArg[]): this;
}

/**
 * Message Builder class for styling messages. Extends the CoreMsgBuilder to
 * provide custom formatting using chained messages. If you prefer to declare
 * and use a custom set of formatting metchods, declare your own MsgBuilder and
 * pass it to the LogManager.
 */
export class Console extends Base implements IConsole, MsgBuilder.IEmitDuration {
  static readonly styleFormatters = styleFormatters;

  static override factoryMethod(
    level: Level.Name,
    emitter: Logger.IEmitter,
    meetsThreshold: boolean = true,
  ): Console {
    return new Console(level, emitter, meetsThreshold);
  }

  /**
   * Emits a styled text message.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public text(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.text, ...args);
  }
  /**
   * Emits a styled h1 message.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public h1(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.h1, ...args);
  }
  /**
   * Emits a styled h2 message.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public h2(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.h2, ...args);
  }

  /**
   * Emits a styled h3 message.
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public h3(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.h3, ...args);
  }

  /**
   * Emits a styled action message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public action(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.action, ...args);
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
   * Emits a styled date message. XXX add more info
   * @param {...StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public date(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(styleFormatters.date, ...args);
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
   * Calculates and emits the elapsed time since the last mark.
   * If no time has elapsed, it returns the current instance.
   * @returns {this} The current instance for method chaining.
   */
  // public elapsed(): this {
  //   const duration = performance.now() - this._t0;
  //   if (duration) {
  //     return this.stylize(styleFormatters._elapsed, duration);
  //   }
  //   return this;
  // }

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
