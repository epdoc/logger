import type { HrMilliseconds } from '@epdoc/duration';
import { isNonEmptyString } from '@epdoc/type';
import { assert } from '@std/assert';
import { cli, ILogLevels, type LevelName, LogLevel, LogLevelFactoryMethod, std } from './levels/index.ts';
import { Logger } from './logger.ts';
import { IMsgBuilder } from './message/index.ts';
import { createConsoleTransport, ITransport } from './transports/index.ts';
import type { ILogEmitter, LogEmitterShowOpts, LoggerFactoryMethod, LogRecord } from './types.ts';

/**
 * LogMgr is responsible for managing loggers, log levels, and transports.
 */
export class LogMgr {
  protected _t0: Date = new Date();
  protected _type: string | undefined;
  protected _logLevels: ILogLevels | undefined;
  protected _msgBuilder: IMsgBuilder | undefined;
  protected _threshold: LogLevel = 5;
  protected _show: LogEmitterShowOpts = {};
  protected _pkg: string = '';
  protected _reqId: string = '';
  protected _mark: Record<string, HrMilliseconds> = {};
  protected _registeredLoggers: Record<string, LoggerFactoryMethod> = {
    cli: cli.getLogger,
    std: std.getLogger,
  };
  protected _registeredLogLevels: Record<string, LogLevelFactoryMethod> = {
    cli: cli.createLogLevels,
    std: std.createLogLevels,
  };
  protected _transports: ITransport[] = [];

  /**
   * Creates an instance of LogMgr.
   * @param {string} [type] - The type of logger to use.
   */
  constructor(type?: string) {
    this._transports = [createConsoleTransport(this)];
    if (isNonEmptyString(type)) {
      assert(this._registeredLoggers[type], `No logger for ${type} levels`);
      assert(this._registeredLogLevels[type], `No levels for ${type}`);
      this._type = type;
      this._logLevels = this._registeredLogLevels[type]();
    }
  }

  /**
   * Registers a new logger and its corresponding log levels. This would
   * normally require a custom logger factory method. If using an existing log
   * level set, you can use an existing log level factory method (eg.
   * std.getLogger)
   * @param {string} type - The unique identifying name for this logger. Use
   * this same name when calling getLogger.
   * @param {LoggerFactoryMethod} logger - The logger factory method.
   * @param {LogLevelFactoryMethod} levels - The log level factory method.
   * @returns {this} The instance of LogMgr.
   */
  registerLogger(type: string, logger: LoggerFactoryMethod, levels: LogLevelFactoryMethod): this {
    this._registeredLoggers[type] = logger;
    this._registeredLogLevels[type] = levels;
    return this;
  }

  /**
   * Currently this is not used and we support only the Console transport.
   * Alternate transports will be implemented later.
   * @param transport
   * @returns
   */
  setTransport(transport: ITransport): this {
    this._transports = [transport];
    this.setThreshold(5);
    return this;
  }

  /**
   * Currently this is not used and we support only the Console transport.
   * Alternate transports will be implemented later.
   * @param transport
   * @returns
   */
  addTransport(transport: ITransport): this {
    this._transports.push(transport);
    this.setThreshold(5);
    return this;
  }

  /**
   * Gets the start time of the LogMgr instance.
   * @returns {Date} The start time.
   */
  get startTime(): Date {
    return this._t0;
  }

  /**
   * Sets the show options for log emission. What is shown may also depend on
   * the transport being used.
   * @param {LogEmitterShowOpts} opts - The show options.
   * @returns {this} The instance of LogMgr.
   */
  setShow(opts: LogEmitterShowOpts): this {
    this._show = opts;
    return this;
  }

  /**
   * Gets the current show options for log emission.
   * @returns {LogEmitterShowOpts} The current show options.
   */
  getShow(): LogEmitterShowOpts {
    return this._show;
  }

  /**
   * Gets a logger of the specified type. The two built-in types are 'cli' and 'std'.
   * @param {string} [type] - The type of logger to get.
   * @returns {Logger} The logger instance.
   */
  getLogger(type?: string): ILogEmitter {
    this._type = type ? type : this._type;
    assert(
      this._type,
      `Logger type not specified (try one of ${Object.keys(this._registeredLoggers).join(', ')})`,
    );
    assert(this._registeredLoggers[this._type], `No logger for ${type} levels`);
    assert(this._registeredLogLevels[this._type], `No levels for ${type}`);
    this._logLevels = this._registeredLogLevels[this._type]();
    return this._registeredLoggers[this._type](this);
  }

  /**
   * Emits a log message using the specified logger. This is called by the
   * Logger implementation which, in turn, is called by the {@link IMsgBuilder}
   * implementation.
   * @param {LogRecord} msg - The log message to emit.
   * @param {Logger} logger - The logger to use for emitting the message.
   */
  emit(msg: LogRecord, logger: Logger): void {
    if (this.meetsThreshold(msg.level)) {
      this._transports.forEach((transport) => {
        transport.emit(msg, logger);
      });
    }
  }

  /**
   * Gets the log levels that we are using. The ILogLevels is set when we choose
   * a logger (eg. with the getLogger method).
   * @returns {ILogLevels} The log levels.
   * @throws Will throw an error if log levels are not set.
   */
  get logLevels(): ILogLevels {
    assert(this._logLevels, 'LogLevels not set for Logger');
    return this._logLevels as ILogLevels;
  }

  /**
   * Gets the current log threshold level.
   * @returns {LogLevel} The current threshold level as an Integer.
   */
  get threshold(): LogLevel {
    return this._threshold;
  }

  /**
   * Sets the log threshold level. This will apply across all transports.
   * @param {LevelName | LogLevel} level - The new threshold level.
   * @returns {this} The instance of LogMgr.
   * @throws Will throw an error if log levels are not set.
   */
  setThreshold(level: LevelName | LogLevel): this {
    assert(
      this._logLevels,
      'LogLevels must be set before calling setThreshold. Have you registered and configured your logger?',
    );
    this._threshold = this.logLevels.asValue(level);
    this._transports.forEach((transport) => {
      transport.thresholdUpdated();
    });
    return this;
  }

  /**
   * Checks if the given log level meets the currently set threshold. If
   * threshold is not set, then compares against the value that was set with the
   * setThreshold method.
   * @param {LogLevel | LevelName} level - The log level to check.
   * @param {LogLevel | LevelName} [threshold] - Optional threshold to compare
   * against.
   * @returns {boolean} True if the log level meets the threshold, false
   * otherwise.
   * @throws Will throw an error if the threshold is not set.
   */
  meetsThreshold(level: LogLevel | LevelName, threshold?: LogLevel | LevelName): boolean {
    if (threshold !== undefined) {
      return this.logLevels.meetsThreshold(level, threshold);
    }
    assert(this._threshold, 'Log threshold not set');
    return this.logLevels.meetsThreshold(level, this._threshold);
  }

  /**
   * Sets the flush threshold level. If a message exceeds this level then it
   * will be output immediately. Otherwise it may be buffered.
   * @param {LogLevel | LevelName} level - The flush threshold level.
   * @returns {boolean} True if the level meets the flush threshold, false
   * otherwise.
   */
  setFlushThreshold(level: LogLevel | LevelName): boolean {
    return this.logLevels.meetsFlushThreshold(level);
  }
}
