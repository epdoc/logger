import type { HrMilliseconds } from '@epdoc/duration';
import type { IBasic as LevelIBasic } from '$level';
import type * as Level from '$level';
import type { Entry } from '../types.ts';

export * from './factory.ts';

/**
 * Defines the core contract for a logger, responsible for emitting log entries
 * and managing contextual properties.
 */
export interface IEmitter extends IMark {
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
  // set reqId(val: string);
  /**
   * Retrieves the fully-qualified, dot-separated request ID.
   */
  // get reqId(): string;
  /**
   * Retrieves the array of request IDs.
   * @internal
   */
  get reqIds(): string[];
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
   * Sets the log level threshold for this logger.
   * @param {Level.Name | Level.Value} level - The threshold to set.
   */
  set threshold(level: Level.Name | Level.Value);
  /**
   * Retrieves the logger's effective threshold.
   */
  get threshold(): Level.Value;
  /**
   * Checks if a log level meets the specified threshold.
   * @param {Level.Value | Level.Name} level - The level to check.
   * @param {Level.Value | Level.Name} [threshold] - An optional, overriding threshold.
   * @returns {boolean} `true` if the level meets the threshold.
   */
  meetsThreshold(level: Level.Value | Level.Name, threshold?: Level.Value | Level.Name): boolean;
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
 * Defines the contract for managing log level thresholds.
 */
export interface ILevels {
  /**
   * Retrieves the active log level configuration.
   */
  get logLevels(): LevelIBasic;
  /**
   * Sets the log level threshold.
   * @param {Level.Name | Level.Value} level - The threshold to set.
   * @returns {ILevels} The instance for chaining.
   */
  setThreshold(level: Level.Name | Level.Value): ILevels;
  /**
   * Sets the log level threshold.
   */
  set threshold(level: Level.Name | Level.Value);
  /**
   * Retrieves the effective log level threshold.
   */
  get threshold(): Level.Value;
  /**
   * Checks if a log level meets a given threshold.
   * @param {Level.Value | Level.Name} level - The level to check.
   * @param {Level.Value | Level.Name} threshold - The threshold to check against.
   * @returns {boolean} `true` if the level meets the threshold.
   */
  meetsThreshold(level: Level.Value | Level.Name, threshold: Level.Value | Level.Name): boolean;
  /**
   * Checks if a log level meets the immediate flush threshold.
   * @param {Level.Value | Level.Name} level - The level to check.
   * @returns {boolean} `true` if the level requires an immediate flush.
   */
  meetsFlushThreshold(level: Level.Value | Level.Name): boolean;
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

/**
 * Defines the parameters for creating a child logger.
 */
export interface IGetChildParams {
  /**
   * A session identifier, often tied to a user.
   */
  sid?: string;
  /**
   * A unique identifier for a request or operation.
   */
  reqId?: string;
  /**
   * A namespace, such as a class or module name.
   */
  pkg?: string;
}
