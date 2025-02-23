import type { HrMilliseconds } from '@epdoc/duration';
import { assert } from '@std/assert';
// import { cli, ILogLevels, type Level.Name, Level.Value, LogLevelFactoryMethod, std } from './levels/index.ts';
import type { Dict } from '@epdoc/type';
import { cli, type Level, std } from './levels/index.ts';
import type * as Logger from './logger/index.ts';
import * as MsgBuilder from './message/index.ts';
import * as Transport from './transports/index.ts';
import type * as Log from './types.ts';

/**
 * LogMgr is responsible for managing loggers, log levels, and transports.
 */
export class LogMgr<M extends MsgBuilder.IBasic = MsgBuilder.Console> {
  protected readonly _t0: Date = new Date();
  protected _type: string | undefined;
  protected _logLevels: Level.IBasic | undefined;
  protected _rootLogger: Logger.IEmitter | undefined;
  protected _msgBuilder: MsgBuilder.IBasic | undefined;
  protected _threshold: Level.Value = 5;
  protected _show: Log.EmitterShowOpts = {};
  protected _pkg: string = '';
  protected _reqId: string = '';
  protected _mark: Record<string, HrMilliseconds> = {};
  protected _bRunning = true;
  protected _queue: Log.Entry[] = [];
  readonly transportMgr: Transport.Mgr<M> = new Transport.Mgr<M>(this);
  protected _msgBuilderFactory: MsgBuilder.FactoryMethod = MsgBuilder.Console.factoryMethod;
  protected _loggerFactory: Logger.FactoryMethod<M> = std.getLogger<M>;

  protected _registeredLogLevels: Record<string, Level.FactoryMethod> = {
    cli: cli.createLogLevels,
    std: std.createLogLevels,
  };

  /**
   * Creates an instance of LogMgr.
   *
   * @param createLoggerClass - The Logger implementation class.
   * @param msgBuilderFactory - The MsgBuilder implementation class.
   * @param type - Optional logger type (for selecting log levels, etc.).
   */
  constructor(levelsFactory: Level.FactoryMethod = std.createLogLevels) {
    this._logLevels = levelsFactory();
    // this._transports = [Transport.factoryMethod<M>(this)];
  }

  set msgBuilderFactory(msgBuilderFactory: MsgBuilder.FactoryMethod) {
    this._msgBuilderFactory = msgBuilderFactory;
  }

  get msgBuilderFactory(): MsgBuilder.FactoryMethod {
    return this._msgBuilderFactory;
  }

  set loggerFactory(loggerFactory: Logger.FactoryMethod<M>) {
    this._loggerFactory = loggerFactory;
  }

  get loggerFactory(): Logger.FactoryMethod<M> {
    return this._loggerFactory;
  }

  /**
   * Sets the log threshold level. This will apply across all transports.
   * @param {Level.Name | Level.Value} level - The new threshold level.
   * @returns {this} The instance of LogMgr.
   * @throws Will throw an error if log levels are not set.
   */
  set threshold(level: Level.Name | Level.Value) {
    assert(
      this._logLevels,
      'LogLevels must be set before calling setThreshold. Have you registered and configured your logger?'
    );
    this._threshold = this.logLevels.asValue(level);
    this.transportMgr.setThreshold(this._threshold);
  }

  /**
   * Gets the current log threshold level.
   * @returns {Level.Value} The current threshold level as an Integer.
   */
  get threshold(): Level.Value {
    return this._threshold;
  }

  /**
   * Sets the show options for log emission. What is shown may also depend on
   * the transport being used.
   * @param {EmitterShowOpts} opts - The show options.
   * @returns {this} The instance of LogMgr.
   */
  set show(opts: Log.EmitterShowOpts) {
    this._show = opts;
    this.transportMgr.show(opts);
  }
  get show(): Log.EmitterShowOpts {
    return this._show;
  }

  /**
   * Returns a root logger instance by invoking new on the stored logger class.
   */
  getLogger(): Logger.IEmitter {
    if (!this.transportMgr.transports.length) {
      const transport = new Transport.Console(this, { show: this._show });
      this.transportMgr.add(transport);
    }
    if (!this.transportMgr.running) {
      this.start();
    }
    if (!this._rootLogger) {
      this._rootLogger = this._loggerFactory(this);
    }
    return this._rootLogger;
  }

  /**
   * Returns a new MsgBuilder instance for the given level using new on the stored class.
   * Note: Typically a logger would call this method passing itself.
   *
   * @param level - The log level.
   * @param logger - The logger instance to associate with this message builder.
   */
  getMsgBuilder(level: string, emitter: Log.IEmitter, params: Log.IParams): M {
    const meetsThreshold = this.meetsThreshold(level);
    const meetsFlushThreshold = this.meetsFlushThreshold(level);
    return this._msgBuilderFactory(level, params, emitter, meetsThreshold, meetsFlushThreshold) as M;
  }

  /**
   * Gets the start time of the LogMgr instance.
   * @returns {Date} The start time.
   */
  get startTime(): Date {
    return this._t0;
  }

  addTransport(transport: Transport.Base<M>): this {
    this.transportMgr.add(transport);
    return this;
  }

  removeTransport(transport: Transport.Base<M>): this {
    this.transportMgr.remove(transport);
    return this;
  }

  async start(): Promise<void> {
    await this.transportMgr.start();
    this.flushQueue();
  }

  async stop(): Promise<void> {
    await this.transportMgr.stop();
  }

  /**
   * Log messages are first written to a buffer, then flushed. Calling this function will force
   * the queue to be flushed. Normally this function should not need to be called. Will only
   * flush the queue if all transports are ready to receive messages.
   * @returns {LogManager}
   * @private
   */
  flushQueue() {
    if (this._bRunning && this._queue.length) {
      if (this.transportMgr.allReady()) {
        const nextMsg = this._queue.shift();
        if (nextMsg) {
          this.transportMgr.emit(nextMsg);
          for (let idx = 0; idx < this.transportMgr.transports.length; idx++) {
            const transport = this.transportMgr.transports[idx];
            // const logLevel = transport.level || nextMsg.level || this.logLevel;
            if (this.meetsThreshold(nextMsg.level)) {
              // nextMsg._logLevel = undefined;
              transport.emit(nextMsg);
            }
          }
          this.flushQueue();
        }
      }
    }
    return this;
  }

  _rootEmit(level: string, pkg: string, msg: string, data?: Dict): void {
    const entry: Log.Entry = {
      timestamp: new Date(),
      level: level,
      package: pkg,
      data: data,
      msg: msg,
    };
    if (this._rootLogger) {
      entry.reqId = this._rootLogger.reqId;
      entry.sid = this._rootLogger.sid;
    }
    this.emit(entry);
  }

  /**
   * Emits a log message using the specified logger. This is called by the
   * Logger implementation which, in turn, is called by the {@link IMsgBuilder}
   * implementation.
   * @param {Entry} msg - The log message to emit.
   * @param {Logger.Basic} logger - The logger to use for emitting the message.
   */
  emit(msg: Log.Entry): void {
    if (this.meetsThreshold(msg.level)) {
      this.transportMgr.emit(msg);
      if (this.meetsFlushThreshold(msg.level)) {
        this.flushQueue();
      }
    }
  }

  /**
   * Gets the log levels that we are using. The ILogLevels is set when we choose
   * a logger (eg. with the getLogger method).
   * @returns {ILogLevels} The log levels.
   * @throws Will throw an error if log levels are not set.
   */
  get logLevels(): Level.IBasic {
    assert(this._logLevels, 'LogLevels not set for Logger');
    return this._logLevels as Level.IBasic;
  }

  /**
   * Evaluates whether a given log level satisfies the configured threshold.
   *
   * This method first converts the provided level (and optional threshold value)
   * to its numeric representation. If an explicit threshold is provided, it checks
   * whether the numeric value of the level meets that threshold; if not, it returns false.
   * Next, it asserts that a default threshold is set on the LogMgr, and compares the level
   * against this default threshold. Finally, it consults the transport manager to confirm
   * that the computed level value is acceptable across any configured transport.
   *
   * @param {Level.Value | Level.Name} level - The log level to check, either as a numeric value or name.
   * @param {Level.Value | Level.Name} [threshold] - Optional. A specific threshold to compare against instead of the default.
   * @returns {boolean} Returns true if the log level meets the configured threshold (both explicitly provided and default) and passes the transport manager's checks; otherwise, false.
   *
   * @throws Will throw an error if the default log threshold is not set.
   */
  meetsThreshold(level: Level.Value | Level.Name, threshold?: Level.Value | Level.Name): boolean {
    const levelVal = this.logLevels.asValue(level);
    if (threshold !== undefined) {
      if (!this.logLevels.meetsThresholdValue(levelVal, this.logLevels.asValue(threshold))) {
        return false;
      }
    }
    assert(this._threshold, 'Log threshold not set');
    if (!this.logLevels.meetsThresholdValue(levelVal, this._threshold)) {
      return false;
    }
    return this.transportMgr.meetsAnyThresholdValue(levelVal);
  }

  /**
   * Sets the flush threshold level. If a message exceeds this level then it
   * will be output immediately. Otherwise it may be buffered.
   * @param {Level.Value | Level.Name} level - The flush threshold level.
   * @returns {boolean} True if the level meets the flush threshold, false
   * otherwise.
   */
  meetsFlushThreshold(level: Level.Value | Level.Name): boolean {
    return this.logLevels.meetsFlushThreshold(level);
  }
}
