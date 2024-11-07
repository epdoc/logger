import * as core from '@epdoc/message';
import * as colors from '@std/fmt/colors';

export const styleFormatters = {
  text: colors.brightWhite,
  h1: (str: string) => colors.bold(colors.magenta(str)),
  h2: colors.magenta,
  h3: colors.green,
  action: (str: string) => colors.black(colors.bgYellow(str)),
  label: colors.blue,
  highlight: colors.brightMagenta,
  value: colors.brightBlue,
  path: colors.blue,
  date: colors.brightCyan,
  warn: colors.brightMagenta,
  error: (str: string) => colors.bold(colors.brightRed(str)),
  strikethru: colors.inverse,
  _reqId: colors.brightYellow,
  _sid: colors.yellow,
  _emitter: colors.green,
  _action: colors.blue,
  _plain: colors.white,
  _suffix: colors.white,
  _elapsed: colors.white,
  _errorPrefix: colors.red,
  _warnPrefix: colors.cyan,
  _infoPrefix: colors.gray,
  _verbosePrefix: colors.gray,
  _debugPrefix: colors.gray,
  _sillyPrefix: colors.gray,
  _httpPrefix: colors.gray,
  _timePrefix: colors.gray,
} as const;

// export class Style extends base.Style {
//   constructor() {
//     super();
//     this.setStyles(styleFormatters);
//   }
// }

// export type StyleName = keyof typeof styleFormatters;

/**
 * Message Builder class for styling messages. Extends the BaseMsgBuilder to
 * provide custom formatting using chained messages. If you prefer to declare
 * and use a custom set of formatting metchods, declare your own MsgBuilder and
 * pass it to the LogManager. s
 */
export class MsgBuilder extends core.MsgBuilder {
  protected _t0: number = performance.now();

  /**
   * Emits a styled text message.
   * @param {...core.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public text(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.text, ...args);
  }
  /**
   * Emits a styled h1 message.
   * @param {...core.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public h1(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.h1, ...args);
  }
  /**
   * Emits a styled h2 message.
   * @param {...core.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public h2(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.h2, ...args);
  }

  /**
   * Emits a styled h3 message.
   * @param {...core.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public h3(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.h3, ...args);
  }

  /**
   * Emits a styled action message.
   * @param {...core.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public action(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.action, ...args);
  }

  /**
   * Emits a styled label message.
   * @param {...core.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public label(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.label, ...args);
  }

  /**
   * Emits a styled highlight message.
   * @param {...core.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public highlight(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.highlight, ...args);
  }

  /**
   * Emits a styled value message.
   * @param {...core.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public value(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.value, ...args);
  }

  /**
   * Emits a styled path message. Use for displaying file paths or filenames.
   * @param {...core.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public path(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.path, ...args);
  }

  /**
   * Emits a styled date message. XXX add more info
   * @param {...core.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public date(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.date, ...args);
  }

  /**
   * Emits a styled warning message.
   * @param {...core.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public warn(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.warn, ...args);
  }
  /**
   * Emits a styled error message.
   * @param {...core.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public error(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.error, ...args);
  }

  /**
   * Emits a styled strikethru message.
   * @param {...core.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public strikethru(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.strikethru, ...args);
  }

  /**
   * Marks the current time for measuring elapsed time. If mark is not called,
   * the current time is taken from when the MsgBuidler object is created. This
   * occurs when a logger method such as logger.info or logger.debug is called.
   * @returns {this} The current instance for method chaining.
   */
  public mark(): this {
    this._t0 = performance.now();
    return this;
  }

  /**
   * Calculates and emits the elapsed time since the last mark.
   * If no time has elapsed, it returns the current instance.
   * @returns {this} The current instance for method chaining.
   */
  public elapsed(): this {
    const duration = performance.now() - this._t0;
    if (duration) {
      return this.stylize(styleFormatters._elapsed, duration);
    }
    return this;
  }

  /**
   * @param duration
   * @returns
   */
  emitWithTime(duration?: number): core.LogMessage {
    return this.ewt(duration);
  }

  /**
   * Emits a message with the elapsed time since the last mark.
   * If a duration is provided, it will be used; otherwise, the duration
   * is calculated from the last mark to the current time.
   *
   * @param duration - The time duration in milliseconds. If not provided,
   *                  it defaults to the time elapsed since the last mark.
   * @returns A formatted string representing the elapsed time.
   */
  ewt(duration: number = performance.now() - this._t0): core.LogMessage {
    if (duration) {
      return this.stylize(styleFormatters._elapsed, `(${duration.toFixed(3)} ms response)`).emit();
    }
    return this.emit();
  }
}
