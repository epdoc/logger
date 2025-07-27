import type { HrMilliseconds } from '@epdoc/duration';
import { isNonEmptyArray, isString } from '@epdoc/type';
import { assert } from '@std/assert/assert';
import type * as Level from '../../levels/types.ts';
import type { LogMgr } from '../../logmgr.ts';
import type * as MsgBuilder from '../../message/mod.ts';
import type { EmitterShowOpts, Entry } from '../../types.ts';
import type { IEmitter, IGetChildParams, IInherit, ILevels } from './types.ts';

let markId = 0;

/**
 * Provides the core foundation for all logger instances, handling essential
 * functionalities like hierarchical logging, session and request tracking, and
 * performance marking.
 *
 * @remarks
 * This class is not typically used directly but is extended by specialized
 * loggers (e.g., `StdLogger`, `CliLogger`) that implement specific log level
 * methods.
 *
 * It includes built-in support for contextual logging, which is crucial for
 * tracing operations within complex applications, such as server requests.
 * A new logger instance can be created for each request using the
 * {@link getChild} method, allowing for unique tracking identifiers:
 *
 * - `sid`: A session ID, often tied to a user, to group all related logs.
 * - `reqId`: A unique request ID to trace a single operation from start to finish.
 * - `pkg`: A namespace (e.g., `ClassName.methodName`) to pinpoint the code
 *   origin of a log message. This can be nested by creating further child loggers.
 *
 * @template M - The type of message builder to use, which must conform to the
 * {@link MsgBuilder.IBasic} interface.
 * @implements {Logger.IEmitter}
 * @implements {Logger.ILevels}
 * @implements {Logger.IInherit}
 */
export abstract class AbstractLogger<M extends MsgBuilder.Base.IBuilder> implements IEmitter, ILevels, IInherit {
  protected _logMgr: LogMgr<M>;
  protected _parent: this | undefined;
  protected _threshold: Level.Value | undefined;
  protected _show: EmitterShowOpts = { reqIdSep: '.', pkgSep: '.' };
  protected _pkgs: string[] = [];
  protected _reqIds: string[] = [];
  protected _sid: string | undefined;
  protected _mark: Record<string, HrMilliseconds> = {};

  /**
   * Initializes a new logger instance.
   *
   * @param {LogMgr<M>} logMgr - The central log manager responsible for message
   * processing and transport coordination.
   * @param {Logger.IGetChildParams} [params] - Optional parameters used for
   * initializing a child logger with specific context (e.g., `sid`, `reqId`).
   */
  constructor(logMgr: LogMgr<M>, params?: IGetChildParams) {
    this._logMgr = logMgr;
    if (params) {
      this.#appendParams(params);
    }
  }

  /**
   * Creates a new child logger that inherits the context of its parent.
   *
   * @remarks
   * This is the primary method for creating contextual loggers for specific
   * operations, such as handling an incoming HTTP request. The child logger
   * inherits and extends the parent's `sid`, `reqId`, and `pkg`, allowing for
   * detailed, hierarchical tracing.
   *
   * @param {IGetChildParams} [params] - Additional parameters to apply to
   * the new child logger.
   * @returns {this} A new logger instance configured as a child of the current one.
   *
   * @example
   * // Create a logger for a specific user request
   * const reqLogger = rootLogger.getChild({ sid: 'user123', reqId: 'abc-456' });
   * reqLogger.info('Processing user request');
   */
  public getChild(params?: IGetChildParams): this {
    const logger = this.copy();
    logger._parent = this;
    logger.#appendParams(params);
    return logger;
  }

  /**
   * Appends contextual parameters to the logger instance.
   * @private
   */
  #appendParams(params?: IGetChildParams): this {
    if (params) {
      if (params.sid) {
        this._sid = params.sid;
      }
      // Handle reqId efficiently
      if (isNonEmptyArray(params.reqId)) {
        this._reqIds.push(...params.reqId);
      } else if (isString(params.reqId)) {
        this._reqIds.push(params.reqId);
      }
      if (isNonEmptyArray(params.pkg)) {
        this._pkgs.push(...params.pkg);
      } else if (isString(params.pkg)) {
        this._pkgs.push(params.pkg);
      }
    }
    return this;
  }

  /**
   * Creates a shallow copy of the current logger instance.
   * @internal
   */
  copy(): this {
    const result = new (this.constructor as new (logMgr: LogMgr<M>) => this)(this._logMgr);
    result.assign(this);
    return result;
  }

  /**
   * Assigns properties from another logger to this instance.
   * @internal
   */
  assign(logger: AbstractLogger<M>): void {
    this._threshold = logger._threshold;
    this._show = logger._show;
    this._sid = logger._sid;
    this._reqIds = [...logger._reqIds];
    this._pkgs = [...logger._pkgs];
  }

  /**
   * Forwards a log entry to the {@link LogMgr} for processing, but only if it
   * meets the configured log level threshold.
   *
   * @param {Log.Entry} msg - The log entry to emit.
   */
  public emit(msg: Entry): void {
    if (this.meetsThreshold(msg.level) && msg.msg) {
      this._logMgr.emit(msg);
    }
  }

  /**
   * Appends a package name to the logger's context.
   *
   * @remarks
   * The `pkg` is used to trace the origin of a log message, often representing
   * a class or module. Nested packages are joined with a dot (`.`).
   *
   * @param {string} val - The package name to add.
   */
  public set pkg(val: string) {
    this._pkgs.push(val);
  }

  /**
   * Retrieves the fully-qualified, dot-separated package name.
   * @internal
   */
  public get pkg(): string {
    return this._pkgs.join('.');
  }

  /**
   * Retrieves the array of package names.
   * @internal
   */
  public get pkgs(): string[] {
    return this._pkgs;
  }

  /**
   * Appends a package name to the logger's context in a chainable manner.
   *
   * @param {string} [val] - The package name to add.
   * @returns {this} The current logger instance.
   */
  public setPackage(val: string | undefined): this {
    if (val) {
      this._pkgs.push(val);
    }
    return this;
  }

  /**
   * Sets the session ID for the logger's context.
   *
   * @remarks
   * The `sid` is used to group all logs associated with a single user session.
   * It is typically set on a child logger created for a user's request.
   *
   * @param {string} [val] - The session ID.
   */
  public set sid(val: string | undefined) {
    this._sid = val;
  }

  /**
   * Retrieves the session ID.
   * @internal
   */
  public get sid(): string | undefined {
    return this._sid;
  }

  /**
   * Appends a request ID to the logger's context.
   *
   * @remarks
   * The `reqId` is a unique identifier for a single operation or request,
   * allowing all related logs to be traced together.
   *
   * @param {string} val - The request ID to add.
   */
  public set reqId(val: string) {
    this._reqIds.push(val);
  }

  /**
   * Retrieves the fully-qualified, dot-separated request ID string.
   * @internal
   */
  public get reqId(): string {
    return this._reqIds.join('.');
  }

  /**
   * Retrieves the array of request IDs.
   * @internal
   */
  public get reqIds(): string[] {
    return this._reqIds;
  }

  /**
   * Appends a request ID to the logger's context in a chainable manner.
   *
   * @param {string} [val] - The request ID to add.
   * @returns {this} The current logger instance.
   * @internal
   */
  setReqId(val: string | undefined): this {
    if (val) {
      this._reqIds.push(val);
    }
    return this;
  }

  /**
   * Gets the active log level configuration from the log manager.
   */
  public get logLevels(): Level.IBasic {
    return this._logMgr.logLevels;
  }

  /**
   * Gets the associated log manager instance.
   */
  public get logMgr(): LogMgr<M> {
    return this._logMgr;
  }

  /**
   * Gets the parent of this logger, if it is a child logger.
   * @returns {this | undefined} The parent logger or `undefined` if it is a root logger.
   */
  public get parent(): this | undefined {
    return this._parent;
  }

  /**
   * Sets the log level threshold for this specific logger instance.
   *
   * @remarks
   * This threshold acts as a preliminary filter. The final decision to log a
   * message depends on the *most restrictive* threshold among this logger, the
   * {@link LogMgr}, and the transport. A warning is issued if this threshold is
   * less restrictive than the manager's, as the manager's setting will prevail.
   *
   * @param {Level.Name | Level.Value} level - The threshold to set.
   * @returns {this} The current logger instance.
   * @internal
   */
  setThreshold(level: Level.Name | Level.Value): this {
    this._threshold = this.logLevels.asValue(level);
    if (this._logMgr.threshold) {
      if (this._threshold > this._logMgr.threshold) {
        const msg: Entry = {
          level: this.logLevels.warnLevelName,
          msg: `Logger threshold ${this.logLevels.asName(this._threshold)} is less restrictive than LogMgr threshold ${
            this.logLevels.asName(this._logMgr.threshold)
          }. LogMgr threshold will apply.`,
        };
        this._logMgr.emit(msg);
      }
    }
    return this;
  }

  /**
   * Sets the log level threshold for this logger instance.
   *
   * @remarks
   * This is a convenient alternative to the {@link setThreshold} method.
   * The effective threshold is the most restrictive of the logger, log manager,
   * and transport settings.
   *
   * @param {Level.Name | Level.Value} level - The threshold to set.
   */
  public set threshold(level: Level.Name | Level.Value) {
    this.setThreshold(level);
  }

  /**
   * Gets the effective threshold for this logger instance.
   *
   * @returns {Level.Value} The logger's own threshold, or the log manager's
   * threshold if one is not set on the logger.
   */
  public get threshold(): Level.Value {
    return this._threshold || this._logMgr.threshold;
  }

  /**
   * Checks if a given log level meets the effective threshold.
   * @internal
   */
  meetsThreshold(level: Level.Value | Level.Name, threshold?: Level.Value | Level.Name): boolean {
    if (threshold !== undefined) {
      return this.logLevels.meetsThreshold(level, threshold);
    }
    return this._logMgr.meetsThreshold(level, this._threshold);
  }

  /**
   * Checks if a given log level meets the immediate flush threshold.
   * @internal
   */
  meetsFlushThreshold(level: Level.Value | Level.Name): boolean {
    return this.logLevels.meetsFlushThreshold(level);
  }

  /**
   * Creates a high-resolution performance mark.
   *
   * @remarks
   * This method records a timestamp and returns a unique name for the mark.
   * This name can be passed to a message builder's `ewt` (elapsed wall time)
   * method to automatically calculate and log the time elapsed since the mark
   * was created.
   *
   * @returns {string} The unique name of the performance mark.
   * @see {@link demark}
   */
  public mark(): string {
    const name = 'mark.' + ++markId;
    this._mark[name] = performance.now();
    return name;
  }

  /**
   * Measures the time elapsed since a performance mark was created and removes it.
   *
   * @param {string} name - The name of the mark to measure, as returned by {@link mark}.
   * @param {boolean} [keep=false] - If `true`, the mark is not removed after
   * measurement and can be used again.
   * @returns {HrMilliseconds} The elapsed time in milliseconds.
   * @throws {AssertionError} If no mark with the given name exists.
   */
  public demark(name: string, keep = false): HrMilliseconds {
    assert(this._mark[name], `No mark set for ${name}`);
    const result = performance.now() - this._mark[name];
    if (keep !== true) {
      delete this._mark[name];
    }
    return result;
  }
}
