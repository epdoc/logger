import type { HrMilliseconds } from '@epdoc/duration';
import type { Integer } from '@epdoc/type';
import type { Entry, IGetChildParams } from '../types.ts';

export * from './factory.ts';

/**
 * Defines the core contract for a logger, responsible for emitting log entries
 * and managing contextual properties.
 */
export interface ILoggerEmitter extends IMark {
  /**
   * Forwards a log entry to the log manager for processing.
   * @param {Log.Entry} msg - The log entry to emit.
   */
  emit(msg: Entry): void;
  /**
   * Appends a package name to the logger's context.
   * @param {string} val - The package name (e.g., `ClassName.methodName`).
   */
  // set pkg(val: string);
  /**
   * Retrieves the fully-qualified, dot-separated package name.
   */
  // get pkg(): string;
  /**
   * Retrieves the array of package names.
   * @internal
   */
  get pkgs(): string[];
  /**
   * Appends a request ID to the logger's context.
   * @param {string} val - The unique request identifier.
   */
  set reqId(val: string | undefined);
  /**
   * Retrieves the fully-qualified, dot-separated request ID.
   */
  get reqId(): string | undefined;
  /**
   * Sets the session ID for the logger's context.
   * @param {string} val - The session identifier, often tied to a user.
   */
  set sid(val: string);
  /**
   * Retrieves the session ID.
   */
  get sid(): string | undefined;
  /**
   * Sets the message separator (number of spaces between message parts).
   * Set to `undefined` to reset to the default from `show.msgSep`.
   * @param {Integer | undefined} val - The number of spaces, or undefined to use the default.
   */
  set msgSep(val: Integer | undefined);
  /**
   * Retrieves the message separator value, or `undefined` if using the default.
   */
  get msgSep(): Integer | undefined;
  /**
   * Sets the log level threshold for this logger.
   * @param {Level.Name | Level.Severity} level - The threshold to set.
   */
  // setThreshold(level: Level.Spec | Level.Name | Level.Severity): this;
  /**
   * Retrieves the logger's effective threshold.
   */
  // get threshold(): Level.Spec;
  /**
   * /** Alias for {@link meetsThreshold}.
   */
  // meetsThreshold(level: Level.Severity | Level.Name, threshold?: Level.Severity | Level.Name): boolean;
}

/**
 * Defines the contract for creating hierarchical, contextual loggers.
 */
export interface IInherit {
  /**
   * Creates a shallow copy of the logger instance.
   * @returns {this} A new logger instance.
   */
  copy(): this;
  /**
   * Assigns properties from another logger to this one.
   * @param {this} logger - The source logger.
   */
  assign(logger: this): void;
  /**
   * Creates a new child logger.
   * @param {IGetChildParams} [opts] - Contextual parameters for the child.
   * @returns {this} A new child logger instance.
   */
  getChild(opts?: IGetChildParams): this;
  /**
   * Retrieves the parent logger, if one exists.
   * @returns {this | undefined} The parent logger or `undefined`.
   */
  get parent(): this | undefined;
}

/**
 * Defines the contract for performance marking.
 */
export interface IMark {
  /**
   * Creates a high-resolution performance mark.
   * @returns {string} A unique name for the mark, to be used with `demark`.
   */
  mark(): string;
  /**
   * Measures the time elapsed since a mark was created.
   * @param {string} name - The name of the mark to measure.
   * @param {boolean} keep - If `true`, the mark is not removed after measurement.
   * @returns {HrMilliseconds} The elapsed time in milliseconds.
   */
  demark(name: string, keep: boolean): HrMilliseconds;
}
