import type { HrMilliseconds } from '@epdoc/duration';
import { assert } from '@std/assert';
// import { cli, ILogLevels, type Level.Name, Level.Value, LogLevelFactoryMethod, std } from './levels/index.ts';
import type * as Level from '$level';
import type * as Log from '$log';
import * as Logger from '$logger';
import * as MsgBuilder from '$msgbuilder';
import * as Transport from '$transport';
import { Emitter } from './emitter.ts';

/**
 * Central logging manager that coordinates loggers, transports, and message builders.
 *
 * @remarks
 * LogMgr serves as the hub for all logging operations, managing:
 * - Logger instance creation and lifecycle
 * - Log level thresholds and filtering
 * - Transport coordination for output routing
 * - Message builder factory selection
 * - Flush management
 *
 * The manager uses a factory pattern to support different logger types (std, cli, etc.)
 * and implements the new Emitter architecture for direct MsgBuilder-to-Transport communication.
 *
 * @example Basic usage
 * ```ts
 * const logMgr = new Log.Mgr<Log.MsgBuilder.Console.Builder>();
 * logMgr.threshold = 'info';
 *
 * const logger = logMgr.getLogger<Log.Std.Logger>();
 * logger.info.h1('Hello World').emit();
 * ```
 *
 * @example Advanced configuration
 * ```ts
 * const logMgr = new Log.Mgr();
 * logMgr.loggerFactory = Log.Cli.factoryMethods;
 * logMgr.msgBuilderFactory = Log.MsgBuilder.Console.createMsgBuilder;
 * logMgr.addTransport(new Log.Transport.File.Transport(logMgr, { filepath: 'app.log' }));
 * ```
 *
 * @template M - The message builder type, defaults to Console.Builder
 * @public
 */
export class LogMgr<
  M extends MsgBuilder.Abstract = MsgBuilder.Console.Builder,
> {
  protected readonly _t0: Date = new Date();
  protected _type: string | undefined;
  protected _logLevels: Level.IBasic | undefined;
  protected _rootLogger: Logger.IEmitter | undefined;
  protected _msgBuilder: MsgBuilder.Abstract | undefined;
  protected _threshold: Level.Value = 5;
  protected _show: Log.EmitterShowOpts = { pkgSep: '.' };
  // protected _pkg: string = '';
  // protected _reqId: string = '';
  protected _mark: Record<string, HrMilliseconds> = {};
  protected _bRunning = true;
  /**
   * A queue of log messages waiting for a transport to come online.
   */
  protected _queue: Log.Entry[] = [];
  readonly transportMgr: Transport.Mgr = new Transport.Mgr(this as unknown as LogMgr<MsgBuilder.Abstract>);
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
    // this.transportMgr = new Transport.Mgr<M>(this);
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
   * Sets the factory used to create message builder instances. Used to override the
   * default behaviour, which is to use `@epdoc/msgbuilder`.
   * @param {MsgBuilder.FactoryMethod} msgBuilderFactory - The factory function.
   */
  public set msgBuilderFactory(msgBuilderFactory: MsgBuilder.FactoryMethod) {
    this._msgBuilderFactory = msgBuilderFactory;
  }

  /**
   * Gets the factory used to create message builder instances. Under normal circumstances you
   * should not need to use this getter.
   *
   * @returns {MsgBuilder.FactoryMethod} The factory function.
   * @deprecated Give me a reason not to deprecate this getter.
   */
  get msgBuilderFactory(): MsgBuilder.FactoryMethod {
    return this._msgBuilderFactory;
  }

  /**
   * Sets the factories used to create the logger and its dependencies. This will also re-initialize
   * the logger system. Under normal circumstances you would provide the logger factory methods only
   * if not using the default logger, and the prefered way to do this is by calling `init` method
   * directly.
   *
   * @param {Logger.IFactoryMethods<M, Logger.IEmitter>} factories - The set of factory methods.
   * @deprecated Use init method
   */
  public set loggerFactory(factories: Logger.IFactoryMethods<M, Logger.IEmitter>) {
    this.init(factories);
  }

  /**
   * Gets the factories used to create the logger and its dependencies. Under normal circumstances
   * you should not need to use this getter.
   *
   * @returns {Logger.IFactoryMethods<M, Logger.IEmitter>} The set of factory methods.
   * @deprecated Give me a reason not to deprecate this getter.
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
   * Sets the log threshold level. This will apply across all transports, unless overriden by a transport.
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
          pkg: 'LogMgr',
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
      const transport = new Transport.Console.Transport(this as unknown as LogMgr<MsgBuilder.Abstract>, {
        show: this._show,
      });
      this.transportMgr.add(transport);
    }
    if (!this.transportMgr.running) {
      this.start();
    }
    return this._rootLogger as L;
  }

  /**
   * @internal
   * Creates a new message builder instance for a given log level. This is called by the logger and
   * does not need to be called by a user.
   *
   * @remarks
   * This method creates a lightweight Emitter that captures the logger's context and has a direct
   * reference to the TransportMgr, allowing the MsgBuilder to emit directly to transports without
   * going through the Logger and LogMgr.
   *
   * @param {string} level - The log level for the message.
   * @param {Logger.IEmitter} emitter - The logger instance that provides context.
   * @returns {M} A new message builder instance.
   */
  public getMsgBuilder(level: string, emitter: Logger.IEmitter): M {
    const meetsThreshold = this.meetsThreshold(level);
    const meetsFlushThreshold = this.meetsFlushThreshold(level);

    // Create a lightweight emitter that captures context and has direct access to TransportMgr
    const directEmitter = new Emitter(
      level as Level.Name,
      this.transportMgr,
      {
        sid: emitter.sid,
        reqId: emitter.reqId,
        pkgs: emitter.pkgs,
        pkgSep: this._show.pkgSep || '.',
      },
      {
        meetsThreshold,
        meetsFlushThreshold,
      },
      // Pass flush callback to handle flush threshold
      meetsFlushThreshold ? () => this.flushQueue() : undefined,
      // Pass the logger's demark method for ewt functionality
      emitter.demark ? (name: string, keep?: boolean) => emitter.demark!(name, keep ?? false) : undefined,
    );

    return this._msgBuilderFactory(directEmitter) as unknown as M;
  }

  /**
   * Gets the start time of the LogMgr instance.
   * @returns {Date} The start time.
   */
  get startTime(): Date {
    return this._t0;
  }

  public addTransport(transport: Transport.Base.Transport): this {
    this.transportMgr.add(transport);
    return this;
  }

  public removeTransport(transport: Transport.Base.Transport): this {
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
    this.flushQueue();
    await this.transportMgr.stop();
    this._bRunning = false;
  }

  /**
   * Gracefully shuts down all transports and releases resources.
   *
   * Performs the following operations in sequence:
   * 1. Flushes any pending writes/operations
   * 2. Closes all file handles and network connections
   * 3. Releases memory resources
   * 4. Marks the instance as terminated
   *
   * @async
   * @throws {Error} If any transport fails to close cleanly (after all attempts)
   * @returns {Promise<void>} Resolves when all resources are released
   *
   * @example
   * ```ts
   * const logger = new Logger();
   * await logger.close(); // Safe to call multiple times
   * ```
   *
   * @example Error handling
   * ```ts
   * try {
   *   await logger.close();
   * } catch (err) {
   *   console.error('Cleanup failed:', err);
   * }
   * ```
   */
  async close(): Promise<void> {
    await this.stop();
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
   * @internal
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
