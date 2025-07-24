import type { HrMilliseconds } from '@epdoc/duration';
import type { Level } from '../levels/index.ts';
import type { LogMgr } from '../logmgr.ts';
import type * as MsgBuilder from '../message/index.ts';
import type * as Log from '../types.ts';

/**
 * Defines the contract for creating hierarchical, contextual loggers.
 */
export interface IInherit {
  /**
   * Creates a shallow copy of the logger instance.
   * @returns {IInherit} A new logger instance.
   */
  copy(): IInherit;
  /**
   * Assigns properties from another logger to this one.
   * @param {this} logger - The source logger.
   */
  assign(logger: this): void;
  /**
   * Creates a new child logger.
   * @param {IGetChildParams} [opts] - Contextual parameters for the child.
   * @returns {IInherit} A new child logger instance.
   */
  getChild(opts?: IGetChildParams): IInherit;
  /**
   * Retrieves the parent logger, if one exists.
   * @returns {IInherit | undefined} The parent logger or `undefined`.
   */
  get parent(): IInherit | undefined;
}

/**
 * Defines the core contract for a logger, responsible for emitting log entries
 * and managing contextual properties.
 */
export interface IEmitter extends IMark {
  /**
   * Forwards a log entry to the log manager for processing.
   * @param {Log.Entry} msg - The log entry to emit.
   */
  emit(msg: Log.Entry): void;
  /**
   * Appends a package name to the logger's context.
   * @param {string} val - The package name (e.g., `ClassName.methodName`).
   */
  set pkg(val: string);
  /**
   * Retrieves the fully-qualified, dot-separated package name.
   */
  get pkg(): string;
  /**
   * Retrieves the array of package names.
   * @internal
   */
  get pkgs(): string[];
  /**
   * Appends a request ID to the logger's context.
   * @param {string} val - The unique request identifier.
   */
  set reqId(val: string);
  /**
   * Retrieves the fully-qualified, dot-separated request ID.
   */
  get reqId(): string;
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
 * Defines the contract for loggers that support indentation of output.
 */
export interface IIndent {
  /**
   * Increases the indentation level.
   * @param {number | string} [n=1] - The number of levels to indent or a string to use as an indent.
   * @returns {this} The logger instance for chaining.
   */
  indent(n?: number | string): this;
  /**
   * Decreases the indentation level.
   * @param {number} [n=1] - The number of levels to outdent.
   * @returns {this} The logger instance for chaining.
   */
  outdent(n?: number): this;
  /**
   * Retrieves the current indentation strings.
   * @internal
   */
  getdent(): string[];
  /**
   * Resets the indentation to zero.
   * @returns {this} The logger instance for chaining.
   */
  nodent(): this;
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
  reqId?: string | string[];
  /**
   * A namespace, such as a class or module name.
   */
  pkg?: string | string[];
}

/**
 * Defines the contract for managing log level thresholds.
 */
export interface ILevels {
  /**
   * Retrieves the active log level configuration.
   */
  get logLevels(): Level.IBasic;
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
 * Type guard to check if an object implements the {@link IMark} interface.
 * @param {object} val - The object to check.
 * @returns {boolean} `true` if the object has a `mark` method.
 * @internal
 */
export function isIMark(val: object): val is IMark {
  return (<IMark> val).mark !== undefined;
}

/**
 * Defines the factory function signature for creating logger instances.
 *
 * @template M - The type of message builder used by the logger.
 * @param {LogMgr<M> | IEmitter} logMgr - The log manager or a parent emitter.
 * @param {IGetChildParams} [opts] - Optional parameters for child logger creation.
 * @returns {IEmitter} A new logger instance.
 */
export type FactoryMethod<M extends MsgBuilder.IBasic, L extends IEmitter> = (
  logMgr: LogMgr<M> | IEmitter,
  opts?: IGetChildParams,
) => L;
