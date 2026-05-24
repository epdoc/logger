import type * as Log from '$log';
import type * as Level from '@epdoc/loglevels';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { DateTime } from '@epdoc/datetime';
import { type Integer, isArray, isInteger, isPosInteger, isString } from '@epdoc/type';
import * as Base from '../base/mod.ts';

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
   * An array of strings representing the current indentation levels.
   * Each string in the array is prepended to the log message.
   * @protected
   */
  protected _indent: string[] = [];
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
  }

  /**
   * Creates a message builder with indentation applied.
   * This method wraps the LogMgr's getMsgBuilder to apply indentation.
   * @internal
   */
  protected getIndentedMsgBuilder(level: string): M {
    const msgBuilder = this._logMgr.getMsgBuilder(level, this);

    // Apply indentation if present
    if (this._indent.length > 0) {
      const indentPrefix = this._indent.join(' ');
      if (msgBuilder && typeof msgBuilder === 'object' && 'prependMsgPart' in msgBuilder) {
        (msgBuilder as unknown as { prependMsgPart: (str: string) => void }).prependMsgPart(indentPrefix);
      }
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
  public at(level: Level.Spec | Level.Name | Level.Severity): M {
    const spec = this._logMgr.logLevels.asSpec(level);
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
      if (this._indent.length > 0) {
        const indentPrefix = this._indent.join(' ');
        if (typeof msg.msg === 'string') {
          msg.msg = indentPrefix + msg.msg;
        } else if (msg.msg && typeof msg.msg === 'object' && 'prependMsgPart' in msg.msg) {
          (msg.msg as unknown as { prependMsgPart: (str: string) => void }).prependMsgPart(indentPrefix);
        }
      }
      this._logMgr.transportMgr.emit(msg);
    }
  }

  /**
   * Adds one or more levels of indentation to the logger's output.
   *
   * @remarks
   * - If `n` is a `string`, it is added directly as an indentation string.
   * - If `n` is a `number`, that many spaces are added or removed as indentation levels.
   * - If `n` is an `array` of strings, each string is added as an indentation level.
   * - If `n` is `undefined`, a single space is added as an indentation level.
   * - If `n` is `false`, indenting is turned off (same as nodent)
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
   *   using _scope = logger.indent(2);
   *   logger.info.text('Line 1').emit();
   *   logger.info.text('Line 2').emit();
   * } // Automatically outdents here
   *
   * // Manual management (legacy) - must call outdent()
   * logger.indent(2);
   * logger.info.text('Line 1').emit();
   * logger.outdent(2);
   *
   * // Indent automatically suppressed during progress
   * logger.info.text('Building').start();
   * logger.indent();  // No-op - progress is active
   * logger.info.text('Done').stop();
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
    } else if (isString(n)) {
      this._indent.push(n);
      levelsAdded = 1;
    } else if (isPosInteger(n)) {
      for (let x = 0; x < n; ++x) {
        this._indent.push(' ');
      }
      levelsAdded = n;
    } else if (isInteger(n)) {
      // n is negative, remove |n| indent levels
      const levelsToRemove = Math.abs(n);
      for (let x = 0; x < levelsToRemove && this._indent.length > 0; ++x) {
        this._indent.pop();
      }
      levelsAdded = 0; // No levels to outdent for negative indents
    } else if (isArray(n)) {
      for (let x = 0; x < n.length; ++x) {
        this._indent.push(n[x]);
      }
      levelsAdded = n.length;
    } else {
      this._indent.push(' ');
      levelsAdded = 1;
    }

    return new DisposableIndent(this, levelsAdded);
  }

  /**
   * Retrieves the current array of indentation strings.
   * @internal
   */
  getdent(): string[] {
    return this._indent;
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
