import type { HrMilliseconds } from '@epdoc/duration';
import { assert } from '@std/assert';
// import { cli, ILogLevels, type Level.Name, Level.Value, LogLevelFactoryMethod, std } from './levels/index.ts';
import type * as Level from './levels/mod.ts';
import * as Logger from './loggers/mod.ts';
import * as MsgBuilder from './message/mod.ts';
import * as Transport from './transports/mod.ts';
import type * as Log from './types.ts';

/**
 * Defines the settings interface for a {@link LogMgr} instance. This provides a
 * streamlined way to configure key logging behaviors.
 */
// export interface ILogMgrSettings {
//   /**
//    * Sets the minimum log level required for messages to be processed.
//    *
//    * @param {Level.Name | Level.Value} level - The threshold level, specified
//    * either by its name (e.g., 'info', 'warn') or its numeric value.
//    */
//   set threshold(level: Level.Name | Level.Value);
//   /**
//    * Configures the visibility of various log metadata attributes.
//    *
//    * @param {Log.EmitterShowOpts} opts - An object specifying which log
//    * components (e.g., timestamp, package name) to display.
//    */
//   set show(opts: Log.EmitterShowOpts);
//   /**
//    * Retrieves the currently active log level configuration.
//    *
//    * @returns {Level.IBasic} The instance managing the defined log levels.
//    */
//   get logLevels(): Level.IBasic;
// }

/**
 * Manages the entire logging ecosystem, including loggers, levels, and
 * transports.
 *
 * @remarks
 * `LogMgr` is the central hub for configuring and controlling all logging
 * operations. It is responsible for:
 * - Creating and managing logger instances via specified factories.
 * - Defining and applying log level thresholds.
 * - Coordinating transports that direct logs to various outputs (e.g.,
 *   console, file).
 *
 * This class is exported as `Mgr` from the top-level `Log` module, making it
 * accessible via `Log.Mgr`.
 *
 * @example
 * ```ts
 * // Define the type of logger and message builder
 * type M = Log.MsgBuilder.Console.Builder;
 * type L = Log.Std.Logger<M>;
 *
 * // Create a new Log Manager instance.
 * const logMgr = new Log.Mgr<M>();
 *
 * // Get a logger, which also initializes the manager on first call.
 * const log = logMgr.getLogger<L>();
 *
 * // Configure and use the logger.
 * logMgr.threshold = 'verbose';
 * log.info.h2('Hello world').emit();
 * ```
 *
 * @template M - The type of message builder to be used, which must conform to
 * the `MsgBuilder.Base.Builder` class.
 */
export class LogMgr<
  M extends MsgBuilder.Base.Builder = MsgBuilder.Console.Builder,
> {
  protected readonly _t0: Date = new Date();
  protected _type: string | undefined;
  protected _logLevels: Level.IBasic | undefined;
  protected _rootLogger: Logger.IEmitter | undefined;
  protected _msgBuilder: MsgBuilder.Base.Builder | undefined;
  protected _threshold: Level.Value = 5;
  protected _show: Log.EmitterShowOpts = { reqIdSep: '.', pkgSep: '.' };
  // protected _pkg: string = '';
  // protected _reqId: string = '';
  protected _mark: Record<string, HrMilliseconds> = {};
  protected _bRunning = true;
  protected _queue: Log.Entry[] = [];
  readonly transportMgr: Transport.Mgr<M> = new Transport.Mgr<M>(this);
  protected _msgBuilderFactory: MsgBuilder.FactoryMethod = MsgBuilder.Console.createMsgBuilder;
  protected _loggerFactories: Logger.IFactoryMethods<M, Logger.IEmitter> = Logger.Std.factoryMethods;

  // protected registeredLogLevels: Record<
  //   string,
  //   { levels: Level.FactoryMethod; logger: Logger.FactoryMethod<M, Logger.IEmitter> }
  // > = {
  //   cli: { levels: Logger.Cli.createLogLevels, logger: Logger.Cli.createLogger },
  //   std: { levels: Logger.Std.createLogLevels, logger: Logger.Std.createLogger },
  // };

  /**
   * Creates an instance of LogMgr.
   * @param {Log.ILogMgrSettings} [opts] - Optional configuration settings.
   */
  constructor(opts: Log.ILogMgrSettings = {}) {
    if (opts.show) {
      this._show = Object.assign(this._show, opts.show);
    }
    // this._logLevels = this._loggerFactories.createLevels();
  }

  // constructor2(levelsFactory: Level.FactoryMethod = Logger.Std.createLogLevels) {
  //   this._logLevels = levelsFactory();
  //   // this._transports = [Transport.factoryMethod<M>(this)];
  // }

  /**
   * Sets the factory used to create message builder instances.
   * @param {MsgBuilder.FactoryMethod} msgBuilderFactory - The factory function.
   */
  public set msgBuilderFactory(msgBuilderFactory: MsgBuilder.FactoryMethod) {
    this._msgBuilderFactory = msgBuilderFactory;
  }

  /**
   * Gets the factory used to create message builder instances.
   * @returns {MsgBuilder.FactoryMethod} The factory function.
   */
  get msgBuilderFactory(): MsgBuilder.FactoryMethod {
    return this._msgBuilderFactory;
  }

  /**
   * Sets the factories used to create the logger and its dependencies.
   * This will also re-initialize the logger system.
   * @param {Logger.IFactoryMethods<M, Logger.IEmitter>} factories - The set of factory methods.
   */
  public set loggerFactory(factories: Logger.IFactoryMethods<M, Logger.IEmitter>) {
    this.init(factories);
  }

  /**
   * Gets the factories used to create the logger and its dependencies.
   * @returns {Logger.IFactoryMethods<M, Logger.IEmitter>} The set of factory methods.
   */
  public get loggerFactory(): Logger.IFactoryMethods<M, Logger.IEmitter> {
    return this._loggerFactories;
  }

  /**
   * Initializes or re-initializes the logging system with a specific set of
   * logger factories.
   *
   * @remarks
   * This method allows for explicit configuration of the logger type. It is
   * useful if you need to configure the manager *before* the first logger is
   * requested, for instance to set a threshold on a custom logger type. If not
   * called explicitly, the manager will be initialized with default factories
   * upon the first call to `getLogger()`.
   *
   * @param {Logger.IFactoryMethods<M, Logger.IEmitter>} [factories] - The logger
   * factories to use. If not provided, the existing factories will be used.
   * @returns {this} The `LogMgr` instance for chaining.
   */
  public init(factories?: Logger.IFactoryMethods<M, Logger.IEmitter>): this {
    if (factories) {
      this._loggerFactories = factories;
    }
    this._logLevels = this._loggerFactories.createLevels();
    this._rootLogger = this._loggerFactories.createLogger(this);
    return this;
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
      'Methods init() or getLogger() must be called before setting log level threshold.',
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
          pkgs: ['LogMgr'],
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
   * Retrieves the root logger instance.
   *
   * @remarks
   * On the first call, this method initializes the `LogMgr` with default
   * factories (if `init()` has not been called), sets up a default console
   * transport, and starts the logging queue. Subsequent calls return the
   * existing root logger.
   *
   * @example
   * ```ts
   * const logMgr = new Log.Mgr();
   * // Specify the expected logger type for type safety.
   * const logger = logMgr.getLogger<Log.Std.Logger>();
   * logger.info.text('Hello').emit();
   * ```
   *
   * @template L - The expected type of the logger, which must extend `Logger.IEmitter`.
   * @returns {L} The root logger instance.
   */
  public getLogger<L extends Logger.IEmitter>(params: Logger.IGetChildParams = {}): L {
    if (!this._rootLogger) {
      this._logLevels = this._loggerFactories.createLevels();
      this._rootLogger = this._loggerFactories.createLogger(this, params);
    }
    if (!this.transportMgr.transports.length) {
      const transport = new Transport.Console.Transport(this, { show: this._show });
      this.transportMgr.add(transport);
    }
    if (!this.transportMgr.running) {
      this.start();
    }
    return this._rootLogger as L;
  }

  /**
   * Creates a new message builder instance for a given log level.
   *
   * @remarks
   * This method is typically called internally by a logger instance, which
   * passes itself as the emitter.
   *
   * @param {string} level - The log level for the message.
   * @param {Logger.IEmitter} emitter - The logger instance that will emit the message.
   * @returns {M} A new message builder instance.
   */
  public getMsgBuilder(level: string, emitter: Logger.IEmitter): M {
    const meetsThreshold = this.meetsThreshold(level);
    const meetsFlushThreshold = this.meetsFlushThreshold(level);
    return this._msgBuilderFactory(level, emitter, meetsThreshold, meetsFlushThreshold) as unknown as M;
  }

  /**
   * Gets the start time of the LogMgr instance.
   * @returns {Date} The start time.
   */
  get startTime(): Date {
    return this._t0;
  }

  public addTransport(transport: Transport.Base.Transport<M>): this {
    this.transportMgr.add(transport);
    return this;
  }

  public removeTransport(transport: Transport.Base.Transport<M>): this {
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
