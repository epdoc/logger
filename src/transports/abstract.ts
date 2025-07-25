import { dateEx } from '@epdoc/datetime';
import { duration } from '@epdoc/duration';
import { isNonEmptyString, isValidDate } from '@epdoc/type';
import type * as Level from '../levels/types.ts';
import type { LogMgr } from '../logmgr.ts';
import type { IBasic as MsgBuilderIBasic } from '../message/types.ts';
import * as Log from '../types.ts';

/**
 * Defines the common configuration options for any transport.
 */
export interface BaseOptions {
  /**
   * Overrides the default visibility settings for log metadata.
   * @see {@link Log.EmitterShowOpts}
   */
  show?: Log.EmitterShowOpts;
}

/**
 * The abstract base class for all log transports.
 *
 * @remarks
 * A transport is responsible for directing formatted log messages to a specific
 * destination, such as the console, a file, or a remote service. This class
 * provides the foundational structure and lifecycle methods that all concrete
 * transport implementations must extend.
 *
 * Key responsibilities include:
 * - Managing its own log level threshold.
 * - Handling setup, teardown, and destruction of resources.
 * - Formatting and outputting log entries.
 *
 * @template M - The type of message builder used, which must conform to
 * {@link MsgBuilderIBasic}.
 */
export abstract class AbstractTransport<M extends MsgBuilderIBasic> {
  /** A string identifier for the transport type (e.g., 'console', 'file'). */
  public readonly type: string = 'basic';
  protected _logMgr: LogMgr<M>;
  protected _bReady = false;
  protected _opts: BaseOptions;
  protected _level: Level.Value;
  protected _threshold: Level.Value;
  protected _flushThreshold: Level.Value;
  protected _show: Log.EmitterShowOpts = {};

  /**
   * Initializes a new transport instance.
   *
   * @param {LogMgr<M>} logMgr - The central log manager.
   * @param {BaseOptions} [opts={}] - Configuration options for the transport.
   */
  constructor(logMgr: LogMgr<M>, opts: BaseOptions = {}) {
    this._logMgr = logMgr;
    this._opts = opts;
    this._level = logMgr.logLevels.asValue('info');
    this._threshold = logMgr.threshold;
    this._flushThreshold = logMgr.logLevels.asValue('warn');
    this._show = opts.show ?? logMgr.show;
  }

  /**
   * Retrieves the configuration options for this transport.
   */
  getOptions(): BaseOptions {
    return this._opts;
  }

  /**
   * Sets the log level threshold for this specific transport.
   *
   * @param {Level.Name | Level.Value} level - The minimum level required for a
   * message to be processed by this transport.
   * @returns {this} The instance for chaining.
   */
  setThreshold(level: Level.Name | Level.Value): this {
    this._threshold = this._logMgr.logLevels.asValue(level);
    this.thresholdUpdated();
    return this;
  }

  /**
   * Configures the visibility of log metadata fields for this transport.
   *
   * @param {Log.EmitterShowOpts} opts - The visibility settings to apply.
   * @returns {this} The instance for chaining.
   */
  show(opts: Log.EmitterShowOpts): this {
    Object.keys(opts).forEach((key) => {
      const k: Log.EmitterShowKey = key as Log.EmitterShowKey;
      if (opts[k] === true || opts[k] === false || isNonEmptyString(opts[k])) {
        // @ts-ignore Allow dynamic assignment
        this._show[k] = opts[k];
      }
    });
    return this;
  }

  /**
   * Checks if a given numeric log level meets this transport's threshold.
   *
   * @param {Level.Value} level - The numeric log level to check.
   * @returns {boolean} `true` if the level meets the threshold.
   */
  meetsThresholdValue(level: Level.Value): boolean {
    if (this._threshold === undefined) {
      return true;
    }
    return this._logMgr.logLevels.meetsThresholdValue(level, this._threshold);
  }

  /**
   * Checks if a log entry meets this transport's threshold.
   *
   * @param {Log.Entry} msg - The log entry to check.
   * @returns {boolean} `true` if the entry's level meets the threshold.
   */
  msgMeetsThreshold(msg: Log.Entry): boolean {
    const levelValue = this._logMgr.logLevels.asValue(msg.level);
    return this._logMgr.logLevels.meetsThresholdValue(levelValue, this._threshold);
  }

  /**
   * Checks if a numeric log level meets the immediate flush threshold.
   *
   * @param {Level.Value} level - The numeric log level to check.
   * @returns {boolean} `true` if the level requires an immediate flush.
   */
  meetsFlushThresholdValue(level: Level.Value): boolean {
    return this._logMgr.logLevels.meetsThresholdValue(level, this._threshold);
  }

  /**
   * A hook that is called when the threshold is updated.
   * @internal
   */
  thresholdUpdated(): AbstractTransport<M> {
    return this;
  }

  /**
   * Converts a Date object to a string based on the specified format.
   *
   * @param {Date} [d] - The date to format.
   * @param {Log.TimestampFormat} [format] - The desired output format.
   * @returns {string | undefined} The formatted date string or `undefined`.
   */
  dateToString(d: Date | undefined, format: Log.TimestampFormat | undefined): string | undefined {
    if (isValidDate(d) && Log.isTimestampFormat(format)) {
      if (format === 'utc') {
        return d.toISOString();
      } else if (format === 'local') {
        return dateEx(d).toISOLocalString();
      } else if (format === 'elapsed') {
        return duration().narrow.format(d.getTime() - this._logMgr.startTime.getTime());
      }
    }
    return undefined;
  }

  /**
   * Indicates whether the transport is ready to process log messages.
   */
  get ready(): boolean {
    return this._bReady;
  }

  /**
   * Initializes the transport, preparing it for logging (e.g., opening a file stream).
   * @returns {Promise<void>}
   */
  setup(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Gracefully shuts down the transport (e.g., flushes buffers, closes connections).
   * @returns {Promise<void>}
   */
  stop(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Cleans up all resources used by the transport.
   * @returns {Promise<void>}
   */
  destroy(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * The core method where the transport processes and outputs a log entry.
   * Concrete classes must implement this method.
   *
   * @param {Log.Entry} msg - The log entry to process.
   */
  emit(msg: Log.Entry): void {
    if (this.msgMeetsThreshold(msg)) {
      // Implementation-specific logic goes in subclasses.
    }
  }

  /**
   * Checks if this transport is of the same type as another.
   *
   * @param {AbstractTransport<M>} transport - The transport to compare against.
   * @returns {boolean} `true` if the types match.
   */
  match(transport: AbstractTransport<M>): boolean {
    if (this.type === transport.type) {
      return true;
    }
    return false;
  }

  /**
   * Closes the transport.
   * @deprecated Use {@link stop} for graceful shutdown.
   */
  close(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Clears any internal state of the transport (e.g., a buffer).
   */
  clear(): void {}

  /**
   * Indicates if the transport is currently active and operational.
   */
  get alive(): boolean {
    return false;
  }
}
