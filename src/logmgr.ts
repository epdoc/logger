import type { HrMilliseconds } from '@epdoc/duration';
import { assert } from '@std/assert';
// import { cli, ILogLevels, type Level.Name, Level.Value, LogLevelFactoryMethod, std } from './levels/index.ts';
import type { IBasic as IBasicLevel } from './levels/ibasic.ts';
import type { IBasic as LevelIBasic } from './levels/ibasic.ts/';
import { cli, std } from './levels/mod.ts';
import type * as Level from './levels/types.ts';
import type * as Logger from './logger/types.ts';
import { ConsoleFactoryMethod, ConsoleMsgBuilder } from './message/console.ts';
import type * as MsgBuilder from './message/types.ts/';
import type { AbstractTransport } from './transports/abstract.ts';
import { ConsoleTransport } from './transports/console.ts/';
import { TransportMgr } from './transports/mgr.ts/';
import type * as Log from './types.ts';

/**
 * Defines the settings interface for a {@link LogMgr} instance. This provides a
 * streamlined way to configure key logging behaviors.
 */
export interface ILogMgrSettings {
  /**
   * Sets the minimum log level required for messages to be processed.
   *
   * @param {Level.Name | Level.Value} level - The threshold level, specified
   * either by its name (e.g., 'info', 'warn') or its numeric value.
   */
  set threshold(level: Level.Name | Level.Value);
  /**
   * Configures the visibility of various log metadata attributes.
   *
   * @param {Log.EmitterShowOpts} opts - An object specifying which log
   * components (e.g., timestamp, package name) to display.
   */
  set show(opts: Log.EmitterShowOpts);
  /**
   * Retrieves the currently active log level configuration.
   *
   * @returns {Level.IBasic} The instance managing the defined log levels.
   */
  get logLevels(): LevelIBasic;
}

/**
 * Manages the entire logging ecosystem, including loggers, levels, and
 * transports.
 *
 * @remarks
 * `LogMgr` is the central hub for configuring and controlling all logging
 * operations. It is responsible for:
 * - Creating and managing logger instances.
 * - Defining and applying log level thresholds.
 * - Coordinating transports that direct logs to various outputs (e.g.,
 *   console, file).
 *
 * This class is exported as `Mgr` from the top-level `Log` module, making it
 * accessible via `Log.Mgr`.
 *
 * @template M - The type of message builder to be used, which must conform to
 * the `MsgBuilder.IBasic` interface. Defaults to `MsgBuilder.Console`.
 */
export class LogMgr<
  M extends MsgBuilder.IBasic = ConsoleMsgBuilder,
> {
  protected readonly _t0: Date = new Date();
  protected _type: string | undefined;
  protected _logLevels: LevelIBasic | undefined;
  protected _rootLogger: Logger.IEmitter | undefined;
  protected _msgBuilder: MsgBuilder.IBasic | undefined;
  protected _threshold: Level.Value = 5;
  protected _show: Log.EmitterShowOpts = {};
  protected _pkg: string = '';
  protected _reqId: string = '';
  protected _mark: Record<string, HrMilliseconds> = {};
  protected _bRunning = true;
  protected _queue: Log.Entry[] = [];
  readonly transportMgr: TransportMgr<M> = new TransportMgr<M>(this);
  protected _msgBuilderFactory: MsgBuilder.MsgBuidlerFactoryMethod = ConsoleFactoryMethod;
  protected _loggerFactory: Logger.FactoryMethod<M, Logger.IEmitter> = std.createLogger;

  protected _registeredLogLevels: Record<string, Level.FactoryMethod> = {
    cli: cli.createLogLevels,
    std: std.createLogLevels,
  };

  /**
   * Creates an instance of LogMgr.
   *
   * @param {Level.FactoryMethod} [levelsFactory=std.createLogLevels] - A function that returns a log level configuration.
   */
  constructor(levelsFactory: Level.FactoryMethod = std.createLogLevels) {
    this._logLevels = levelsFactory();
    // this._transports = [Transport.factoryMethod<M>(this)];
  }

  public set msgBuilderFactory(msgBuilderFactory: MsgBuilder.MsgBuidlerFactoryMethod) {
    this._msgBuilderFactory = msgBuilderFactory;
  }

  get msgBuilderFactory(): MsgBuilder.MsgBuidlerFactoryMethod {
    return this._msgBuilderFactory;
  }

  public set loggerFactory(loggerFactory: Logger.FactoryMethod<M, Logger.IEmitter>) {
    this._loggerFactory = loggerFactory;
  }

  public get loggerFactory(): Logger.FactoryMethod<M, Logger.IEmitter> {
    return this._loggerFactory;
  }

  /**
   * Sets the log threshold level. This will apply across all transports.
   * @param {Level.Name | Level.Value} level - The new threshold level.
   * @returns {this} The instance of LogMgr.
   * @throws Will throw an error if log levels are not set.
   */
  public set threshold(level: Level.Name | Level.Value) {
    assert(
      this._logLevels,
      'LogLevels must be set before calling setThreshold. Have you registered and configured your logger?',
    );
    this._threshold = this.logLevels.asValue(level);
    if (this._rootLogger) {
      if (this._threshold > this._rootLogger.threshold) {
        const msg: Log.Entry = {
          level: this.logLevels.warnLevelName,
          msg: `LogMgr threshold (${
            this.logLevels.asName(this._threshold)
          }) is less restrictive than root logger threshold (${
            this.logLevels.asName(this._rootLogger.threshold)
          }). Root logger threshold will apply.`,
          package: 'LogMgr',
        };
        this.forceEmit(msg);
      }
    }
    this.transportMgr.setThreshold(this._threshold);
  }

  public get threshold(): Level.Value {
    return this._threshold;
  }

  /**
   * Sets the show options for log emission. What is shown may also depend on
   * the transport being used.
   * @param {EmitterShowOpts} opts - The show options.
   * @returns {this} The instance of LogMgr.
   */
  public set show(opts: Log.EmitterShowOpts) {
    this._show = opts;
    this.transportMgr.show(opts);
  }

  public get show(): Log.EmitterShowOpts {
    return this._show;
  }

  /**
   * Returns a root logger instance by invoking new on the stored logger class.
   *
   * @example
   * const logMgr = new Log.Mgr();
   * const logger = logMgr.getLogger<Log.std.Logger<Log.MsgBuilder.Console>>();
   * logger.info.text('Hello').emit();
   */
  public getLogger<L extends Logger.IEmitter>(): L {
    if (!this.transportMgr.transports.length) {
      const transport = new ConsoleTransport(this, { show: this._show });
      this.transportMgr.add(transport);
    }
    if (!this.transportMgr.running) {
      this.start();
    }
    if (!this._rootLogger) {
      this._rootLogger = this._loggerFactory(this);
    }
    return this._rootLogger as L;
  }

  /**
   * Returns a new MsgBuilder instance for the given level using new on the stored class.
   * Note: Typically a logger would call this method passing itself.
   *
   * @param level - The log level.
   * @param logger - The logger instance to associate with this message builder.
   */
  public getMsgBuilder(level: string, emitter: Logger.IEmitter): M {
    const meetsThreshold = this.meetsThreshold(level);
    const meetsFlushThreshold = this.meetsFlushThreshold(level);
    return this._msgBuilderFactory(level, emitter, meetsThreshold, meetsFlushThreshold) as M;
  }

  /**
   * Gets the start time of the LogMgr instance.
   * @returns {Date} The start time.
   */
  get startTime(): Date {
    return this._t0;
  }

  public addTransport(transport: AbstractTransport<M>): this {
    this.transportMgr.add(transport);
    return this;
  }

  public removeTransport(transport: AbstractTransport<M>): this {
    this.transportMgr.remove(transport);
    return this;
  }

  /**
   * @internal
   */
  async start(): Promise<void> {
    await this.transportMgr.start();
    this.flushQueue();
  }

  /**
   * @internal
   */
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
  flushQueue(): this {
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

  /**
   * Emits a log message. This is called by the
   * Logger implementation which, in turn, is called by the {@link IMsgBuilder}
   * implementation.
   * @param {Entry} msg - The log message to emit.
   */
  public emit(msg: Log.Entry): void {
    if (this.meetsThreshold(msg.level)) {
      this.transportMgr.emit(msg);
      if (this.meetsFlushThreshold(msg.level)) {
        this.flushQueue();
      }
    }
  }

  /**
   * Emits a log message without checking log level thresholds. This is only used internall
   * @param {Entry} msg - The log message to emit.
   * @internal
   */
  forceEmit(msg: Log.Entry): void {
    this.transportMgr.emit(msg);
    this.flushQueue();
  }

  /**
   * Gets the log levels that we are using. The ILogLevels is set when we choose
   * a logger (eg. with the getLogger method).
   * @returns {ILogLevels} The log levels.
   * @throws Will throw an error if log levels are not set.
   */
  get logLevels(): IBasicLevel {
    assert(this._logLevels, 'LogLevels not set for Logger');
    return this._logLevels as IBasicLevel;
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
