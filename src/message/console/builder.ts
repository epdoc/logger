import { asError, type Integer, isInteger, isNonEmptyString, isPosNumber } from '@epdoc/type';
import os from 'node:os'; // Used for homedir in `relative`
import { relative } from 'node:path';
import type * as Level from '../../levels/mod.ts';
import type * as Logger from '../../loggers/mod.ts';
import type * as Log from '../../types.ts';
import * as Base from '../base/mod.ts';
import type * as MsgBuilder from '../types.ts';
import { consoleStyleFormatters } from './const.ts';
import type { IConsoleErrOpts, IConsoleMsgBuilder } from './types.ts';

const home = os.userInfo().homedir;

/**
 * A message builder for creating styled console messages.
 *
 * This class extends `Base` to provide a fluent interface for building
 * complex, styled log messages. It supports various formatting options,
 * including headers, labels, values, and error messages.
 *
 * @example
 * ```ts
 * import { Console } from './console.ts';
 * import { type IEmitter } from '../logger/types.ts';
 *
 * const emitter: IEmitter = {
 *   emit: (entry) => console.log(entry.message),
 *   demark: () => 0,
 * };
 *
 * const msg = new Console('info', emitter);
 * msg.h1('Hello').text('World').emit();
 * ```
 */
export class ConsoleMsgBuilder extends Base.Builder implements IConsoleMsgBuilder, MsgBuilder.IEmitDuration {
  /**
   * A map of style formatters for different message parts.
   */
  static readonly styleFormatters = consoleStyleFormatters;
  protected _nextPartPluralize: boolean | undefined; // true for plural, false for singular, undefined for no effect

  /**
   * A factory method for creating a new `ConsoleMsgBuilder` instance.
   * @param {Level.Name} level - The log level.
   * @param {Logger.IEmitter} emitter - The log emitter.
   * @param {boolean} [meetsThreshold=true] - Whether the log level meets the threshold.
   * @returns {ConsoleMsgBuilder} A new `Console` instance.
   */
  static create(
    level: Level.Name,
    emitter: Logger.Base.IEmitter,
    meetsThreshold: boolean = true,
  ): ConsoleMsgBuilder {
    return new ConsoleMsgBuilder(level, emitter, meetsThreshold);
  }

  /**
   * Appends styled text to the message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public text(...args: MsgBuilder.StyleArg[]): this {
    const processedArgs = this._applyPluralization(args);
    return this.stylize(consoleStyleFormatters.text, ...processedArgs);
  }

  /**
   * Appends a top-level heading (h1) to the message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public h1(...args: MsgBuilder.StyleArg[]): this {
    const processedArgs = this._applyPluralization(args);
    return this.stylize(consoleStyleFormatters.h1, ...processedArgs);
  }

  /**
   * Appends a secondary heading (h2) to the message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public h2(...args: MsgBuilder.StyleArg[]): this {
    const processedArgs = this._applyPluralization(args);
    return this.stylize(consoleStyleFormatters.h2, ...processedArgs);
  }

  /**
   * Appends a tertiary heading (h3) to the message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public h3(...args: MsgBuilder.StyleArg[]): this {
    const processedArgs = this._applyPluralization(args);
    return this.stylize(consoleStyleFormatters.h3, ...processedArgs);
  }

  /**
   * Appends an action-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public action(...args: MsgBuilder.StyleArg[]): this {
    // Action is not typically pluralized based on a count, so no _applyPluralization here.
    return this.stylize(consoleStyleFormatters.action, ...args);
  }

  /**
   * Sets a flag for the next chained method to apply pluralization logic,
   * and outputs the provided number with 'value' styling.
   * @param {Integer} num - The number to display and use for pluralization determination.
   * @returns {this} The current instance for method chaining.
   */
  public count(num: Integer): this {
    // First, output the number itself using the base stylize method.
    // This ensures the number itself is not subject to pluralization logic.
    super.stylize(consoleStyleFormatters.value, num);

    // Now, set the flag for the *next* chained method.
    this._nextPartPluralize = isInteger(num) ? num !== 1 : undefined;
    return this;
  }

  /**
   * Appends a label-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public label(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(consoleStyleFormatters.label, ...args);
  }

  /**
   * Appends a highlighted message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public highlight(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(consoleStyleFormatters.highlight, ...args);
  }

  /**
   * Appends a value-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public value(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(consoleStyleFormatters.value, ...args);
  }

  /**
   * Appends a path-styled message. Use for displaying file paths or filenames.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public path(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(consoleStyleFormatters.path, ...args);
  }

  /**
   * Appends a styled file or folder path, displaying the path relative to the
   * user's home directory. Use for displaying file paths or filenames.
   * @param {string} path - The path to be stylized.
   * @returns {this} The current instance for method chaining.
   */
  relative(path: string): this {
    const s = '~/' + relative(home, path);
    return this.path(s);
  }

  /**
   * Appends a date-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public date(...args: MsgBuilder.StyleArg[]): this {
    return this.stylize(consoleStyleFormatters.date, ...args);
  }

  /**
   * Appends a section divider with an optional title.
   * @param {string} [str=''] - The title of the section.
   * @returns {this} The current instance for method chaining.
   */
  public section(str?: string): this {
    if (!this._allow) return this;
    if (isNonEmptyString(str)) {
      const len = (80 - str.length - 2) / 2;
      return this.h1('-'.repeat(Math.floor(len)) + ' ' + str + ' ' + '-'.repeat(Math.ceil(len)));
    } else {
      return this.h1('-'.repeat(80));
    }
  }

  /**
   * Appends a formatted error message.
   *
   * If the provided `error` is not an `Error` object, it will be converted to one.
   *
   * @param {unknown} error - The error object or value to be logged.
   * @param {ErrOpts} [opts={}] - Options for formatting the error message.
   * @returns {this} The current instance for method chaining.
   */
  public err(error: unknown, opts: IConsoleErrOpts = {}): this {
    if (!this._allow) return this;
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
   * Appends a warning-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public warn(...args: MsgBuilder.StyleArg[]): this {
    return this._allow ? this.stylize(consoleStyleFormatters.warn, ...args) : this;
  }

  /**
   * Appends an error-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public error(...args: MsgBuilder.StyleArg[]): this {
    return this._allow ? this.stylize(consoleStyleFormatters.error, ...args) : this;
  }

  /**
   * Appends a strikethrough-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  public strikethru(...args: MsgBuilder.StyleArg[]): this {
    return this._allow ? this.stylize(consoleStyleFormatters.strikethru, ...args) : this;
  }

  /**
   * Applies pluralization to the given arguments based on the `_nextPartPluralize` flag.
   *
   * This method modifies the arguments for a styling method to handle plural forms.
   * It is called internally and consumes the `_nextPartPluralize` flag after use.
   *
   * @param {MsgBuilder.StyleArg[]} args - The original arguments passed to a styling method.
   * @returns {MsgBuilder.StyleArg[]} The potentially modified arguments after applying pluralization.
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
   * Emits the log entry with a timestamp indicating the duration.
   *
   * @param {number | string} duration - The duration in milliseconds or a string identifier for a marked time.
   * @returns {Log.Entry | undefined} The emitted log entry, or `undefined` if the threshold is not met.
   * @internal
   */
  emitWithTime(duration: number | string): Log.Entry | undefined {
    return this.ewt(duration);
  }

  /**
   * Emits a message with the elapsed time since the last mark.
   *
   * If a duration is provided, it will be used; otherwise, the duration is
   * calculated from the last mark to the current time.
   *
   * @param {number | string} duration - The time duration in milliseconds or a string identifier for a marked time.
   * @param {boolean} [keep=false] - Whether to keep the mark after demarking.
   * @returns {Log.Entry | undefined} The emitted log entry, or `undefined` if the threshold is not met.
   */
  public ewt(duration: number | string, keep = false): Log.Entry | undefined {
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
        return this.stylize(consoleStyleFormatters._elapsed, `(${duration.toFixed(digits)} ms response)`).emit();
      }
      return this.emit();
    }
  }
}
