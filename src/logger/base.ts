import type { HrMilliseconds } from '@epdoc/duration';
import { isNonEmptyArray, isString } from '@epdoc/type';
import { assert } from '@std/assert/assert';
import type { Level } from '../levels/index.ts';
import type { LogMgr } from '../logmgr.ts';
import type * as MsgBuilder from '../message/index.ts';
import type * as Log from '../types.ts';
import type * as Logger from './types.ts';

let markId = 0;

/**
 * Base Logger class that provides core logging functionality. This class serves
 * as a foundation for specialized loggers that implement their own log level
 * methods.
 *
 * The Base logger includes the following properties to enable logging requests,
 * such as received by an HTTP request. For a new request the intent is that the
 * root logger's getChild method be called. Then, with the new child logger, the
 * user would set these properties:
 *
 *   - sid - the session ID, usually corresponding with a user
 *   - reqId - a unique ID for a request
 *   - pkg - can be used, along with further logger getChild nesting, to trace
 *     in what package or method a log message is made.
 *
 * @template M - Type extending MsgBuilder.IBasic for message building
 * @implements {Logger.IEmitter}
 * @implements {Logger.ILevels}
 * @implements {Logger.IInherit}
 */
export class Base<M extends MsgBuilder.IBasic> implements Logger.IEmitter, Logger.ILevels, Logger.IInherit {
  protected _logMgr: LogMgr<M>;
  protected _threshold: Level.Value | undefined;
  protected _show: Log.EmitterShowOpts = {};
  protected _pkgs: string[] = [];
  protected _reqIds: string[] = [];
  protected _sid: string | undefined;
  protected _mark: Record<string, HrMilliseconds> = {};

  /**
   * Creates a new Base logger instance.
   * @param logMgr - The log manager instance. This will need to be called to
   * emit messages to the transports, amongst other things.
   * @param params - Optional parameters for child logger initialization
   */
  constructor(logMgr: LogMgr<M>, params?: Logger.IGetChildParams) {
    this._logMgr = logMgr;
    this.#appendParams(params as Logger.IGetChildParams);
  }

  /**
   * Creates a child logger with inherited properties and additional parameters.
   * This is typically used when you wish to take a root logger and create a new
   * logger for a request branch. In this case reqId and pkg values will be
   * concatenated. If you do not care about concatenating reqId and/or pkg
   * values, and you want a unique reqId to be displayed, you can also ask the
   * logMgr to create a new logger for you.
   * @param params - Parameters for the child logger
   * @returns A new logger instance with inherited and additional properties
   */
  getChild(params?: Logger.IGetChildParams): Base<M> {
    const logger = this.copy();
    logger.#appendParams(params);
    return logger;
  }

  /**
   * Appends additional parameters to the logger instance.
   * @private
   * @param params - Parameters to append
   * @returns The current logger instance
   */
  #appendParams(params?: Logger.IGetChildParams): this {
    if (params) {
      // Handle reqId efficiently
      if (isNonEmptyArray(params.reqId)) {
        this._reqIds.push(...params.reqId);
      } else if (isString(params.reqId)) {
        this._reqIds.push(params.reqId);
      }
      if (params.sid) {
        this._sid = params.sid;
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
   * Creates a copy of the current logger instance. For internal use.
   * @returns A new logger instance with copied properties
   */
  copy(): Base<M> {
    const result = new Base<M>(this._logMgr, this);
    result.assign(this);
    return result;
  }

  /**
   * Assigns properties from another logger to this instance. For internal use.
   * @param logger - Source logger to copy properties from
   */
  assign(logger: Base<M>): void {
    this._threshold = logger._threshold;
    this._show = logger._show;
    this.#appendParams(logger);
  }

  /**
   * Emits a log entry if it meets the loglevel threshold requirements that have
   * been set for this logger and/or the log manager.
   * @param msg - The log entry to emit
   */
  emit(msg: Log.Entry): void {
    if (this.meetsThreshold(msg.level) && msg.msg) {
      this._logMgr.emit(msg);
    }
  }

  /**
   * Adds a package name to the packages array. This will be displayed in log
   * output if `package` is true when calling `logMgr.show`. The `pkg`
   * value is meant to represent the nesting of packages or methods that is
   * called in order to process a request.
   * @param val - Package name to add
   */
  set pkg(val: string) {
    this._pkgs.push(val);
  }

  /**
   * Gets the dot-separated package name string. For internal use.
   * @returns Concatenated package names
   */
  get pkg(): string {
    return this._pkgs.join('.');
  }

  /**
   * Gets the array of package names. For internal use.
   * @returns Array of package names
   */
  get pkgs(): string[] {
    return this._pkgs;
  }

  /**
   * Adds a package name to the packages array and returns the logger instance.
   * This is the same as the `pkg` setter but allows method chaining.
   * @param val - Package name to add
   * @returns The current logger instance
   */
  setPackage(val: string | undefined): this {
    if (val) {
      this._pkgs.push(val);
    }
    return this;
  }

  /**
   * Sets the session ID. This will be displayed in log output if `sid` is true
   * when calling `logMgr.show`. The `sid` is meant to represent the 'user' that
   * a request belongs to. This should be set in conjuction with
   * calling the logger's `getChild` method.
   * @param val - New session ID
   */
  set sid(val: string | undefined) {
    this._sid = val;
  }

  /**
   * Gets the session ID. For internal use.
   * @returns Current session ID or undefined
   */
  get sid(): string | undefined {
    return this._sid;
  }

  /**
   * Adds a request ID to the request IDs array.  This will be displayed in log
   * output if `reqId` is true when calling `logMgr.show`. Normally `reqId`
   * would not need to be nested and will be called once when a new request is
   * received and `getChild` is called in order to create a logger object to
   * track that request.
   * @param val - Request ID to add
   */
  set reqId(val: string) {
    this._reqIds.push(val);
  }

  /**
   * Gets the dot-separated request ID string. For internal use.
   * @returns Concatenated request IDs
   */
  get reqId(): string {
    return this._reqIds.join('.');
  }

  /**
   * Gets the array of request IDs. For internal use.
   * @returns Array of request IDs
   */
  get reqIds(): string[] {
    return this._reqIds;
  }

  /**
   * Adds a request ID to the request IDs array and returns the logger instance.
   * This is no different from the reqId setter, but allows for method chaining.
   * @param val - Request ID to add
   * @returns The current logger instance
   */
  setReqId(val: string | undefined): this {
    if (val) {
      this._reqIds.push(val);
    }
    return this;
  }

  /**
   * Gets the log levels configuration.
   * @returns Log levels configuration
   */
  get logLevels(): Level.IBasic {
    return this._logMgr.logLevels;
  }

  /**
   * Gets the log manager instance.
   * @returns The log manager instance
   */
  get logMgr(): LogMgr<M> {
    return this._logMgr;
  }

  /**
   * Sets the threshold level for this logger instance.
   * Usually set at the LogMgr or Transport level instead.
   * @param level - The threshold level to set
   * @returns The current logger instance
   */
  setThreshold(level: Level.Name | Level.Value): this {
    this._threshold = this.logLevels.asValue(level);
    return this;
  }

  /**
   * Checks if a given log level meets the threshold requirements. For internal use.
   * @param level - The log level to check
   * @param threshold - Optional specific threshold to check against
   * @returns Whether the level meets the threshold
   */
  meetsThreshold(level: Level.Value | Level.Name, threshold?: Level.Value | Level.Name): boolean {
    if (threshold !== undefined) {
      return this.logLevels.meetsThreshold(level, threshold);
    }
    return this._logMgr.meetsThreshold(level, this._threshold);
  }

  /**
   * Checks if a given log level meets the flush threshold. For internal use.
   * @param level - The log level to check
   * @returns Whether the level meets the flush threshold
   */
  meetsFlushThreshold(level: Level.Value | Level.Name): boolean {
    return this.logLevels.meetsFlushThreshold(level);
  }

  /**
   * Creates a performance mark with a unique name. The return value can be
   * passed to a MsgBuilder's ewt method call to record the time between the
   * mark and the log entry.
   * @returns The name of the created mark
   */
  mark(): string {
    const name = 'mark.' + ++markId;
    this._mark[name] = performance.now();
    return name;
  }

  /**
   * Measures the time elapsed since a mark was created.
   * @param name - The name of the mark to measure. This is the value that was returned by the mark method.
   * @param keep - Whether to keep the mark after measuring (default false)
   * @returns The elapsed time in milliseconds
   * @throws {AssertionError} If the mark doesn't exist
   */
  demark(name: string, keep = false): HrMilliseconds {
    assert(this._mark[name], `No mark set for ${name}`);
    const result = performance.now() - this._mark[name];
    if (keep !== true) {
      delete this._mark[name];
    }
    return result;
  }
}
