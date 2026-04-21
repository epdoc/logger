import * as Logger from '$logger';
import * as Transport from '$transport';
import { DateTime } from '@epdoc/datetime';
import type * as Level from '@epdoc/loglevels';
import * as MsgBuilder from '@epdoc/msgbuilder';
import { assert } from '@std/assert';
import { isStrictEmitterShowOpts } from './guards.ts';
import { type ITransportEmitter, MsgEmitter } from './msg-emitter.ts';
import type * as Log from './types.ts';

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
 * and implements direct MsgBuilder-to-Transport communication for performance.
 *
 * @example Basic usage
 * ```ts
 * const logMgr = new Log.Mgr<Log.MsgBuilder.Console.Builder>();
 * logMgr.threshold = 'info';
 *
 * const logger = await logMgr.getLogger<Log.Std.Logger>();
 * logger.info.h1('Hello World').emit();
 * ```
 *
 * @example Advanced configuration
 * ```ts
 * const logMgr = new Log.Mgr();
 * logMgr.loggerFactory = Log.Cli.factoryMethods;
 * logMgr.msgBuilderFactory = Log.MsgBuilder.Console.createMsgBuilder;
 * await logMgr.addTransport(new Log.Transport.File.Transport(logMgr, { filepath: 'app.log' }));
 * ```
 *
 * @template M - The message builder type, defaults to Console.Builder
 * @public
 */
export class LogMgr<
  M extends MsgBuilder.Abstract = MsgBuilder.Console.Builder,
> implements Transport.IBaseOptions, ITransportEmitter {
  #t0: DateTime = DateTime.now();
  #logLevels: Level.LogLevels | undefined;
  #rootLogger: Logger.ILoggerEmitter | undefined;
  #threshold: Level.Spec | null = null;
  #show: Log.EmitterShowOpts = {
    pkgSep: '.',
    level: false,
    pkg: false,
    reqId: false,
    sid: false,
    time: true,
    data: false,
  };
  #bRunning = false;
  readonly transportMgr: Transport.Mgr = new Transport.Mgr(this);
  #msgBuilderFactory: MsgBuilder.FactoryMethod = MsgBuilder.Console.createMsgBuilder;
  #loggerFactories: Logger.IFactoryMethods<M, Logger.ILoggerEmitter> = Logger.Std.factoryMethods;

  /**
   * Creates an instance of LogMgr.
   * @param {Log.ILogMgrSettings} [opts] - Optional configuration settings.
   */
  constructor(opts: Log.ILogMgrSettings = {}) {
    if (opts.show) {
      if (!isStrictEmitterShowOpts(opts.show)) {
        throw new Error('Invalid show options');
      }
      this.#show = Object.assign(this.#show, opts.show);
    }
  }

  /**
   * Sets the factory used to create message builder instances. Used to override the
   * default behaviour, which is to use `@epdoc/msgbuilder`.
   * @param {MsgBuilder.FactoryMethod} msgBuilderFactory - The factory function.
   */
  public set msgBuilderFactory(msgBuilderFactory: MsgBuilder.FactoryMethod) {
    this.#msgBuilderFactory = msgBuilderFactory;
  }

  /**
   * Gets the factory used to create message builder instances. Under normal circumstances you
   * should not need to use this getter.
   *
   * @returns {MsgBuilder.FactoryMethod} The factory function.
   * @deprecated Give me a reason not to deprecate this getter.
   */
  get msgBuilderFactory(): MsgBuilder.FactoryMethod {
    return this.#msgBuilderFactory;
  }

  /**
   * Sets the factories used to create the logger and its dependencies. This will also re-initialize
   * the logger system. Under normal circumstances you would provide the logger factory methods only
   * if not using the default logger, and the prefered way to do this is by calling `init` method
   * directly.
   *
   * @param {Logger.IFactoryMethods<M, Logger.ILoggerEmitter>} factories - The set of factory methods.
   * @deprecated Use init method
   */
  public set loggerFactory(factories: Logger.IFactoryMethods<M, Logger.ILoggerEmitter>) {
    this.initLevels(factories);
  }

  /**
   * Gets the factories used to create the logger and its dependencies. Under normal circumstances
   * you should not need to use this getter.
   *
   * @returns {Logger.IFactoryMethods<M, Logger.ILoggerEmitter>} The set of factory methods.
   * @deprecated Give me a reason not to deprecate this getter.
   */
  public get loggerFactory(): Logger.IFactoryMethods<M, Logger.ILoggerEmitter> {
    return this.#loggerFactories;
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
   * @param {Logger.IFactoryMethods<M, Logger.ILoggerEmitter>} [factories] - The logger
   * factories to use. If not provided, the existing factories will be used.
   * @returns {this} The `LogMgr` instance for chaining.
   */
  initLevels(factories?: Logger.IFactoryMethods<M, Logger.ILoggerEmitter>): this {
    if (factories) {
      this.#loggerFactories = factories;
    }
    if (!this.#logLevels) {
      this.#logLevels = this.#loggerFactories.createLevels();
      this.#threshold = this.#logLevels.defaultLevel;
    }
    return this;
  }

  /**
   * @deprecated Use initLevels() instead.
   */
  public get init(): this {
    return this.initLevels();
  }

  /**
   * Sets the log threshold level. This will apply across all transports, unless overriden by a transport.
   * @param {Level.Name | Level.Severity} level - The new threshold level.
   * @returns {this} The instance of LogMgr.
   * @throws Will throw an error if log levels are not set.
   */
  public setThreshold(level: Level.Name | Level.Severity | Level.Spec) {
    assert(
      this.#logLevels,
      'Methods initLevels() or getLogger() must be called before setting log level threshold.',
    );
    const newThreshold = this.logLevels.asSpec(level);
    assert(newThreshold, `Invalid threshold ${level}`);
    this.#threshold = newThreshold;
    this.transportMgr.setThreshold(this.#threshold);
  }

  set threshold(level: Level.Name | Level.Severity | Level.Spec) {
    this.setThreshold(level);
  }

  get threshold(): Level.Spec {
    assert(this.#threshold, 'No LogMgr threshold set');
    return this.#threshold;
  }

  /**
   * Sets the show options for log emission. What is shown may also depend on
   * the transport being used.
   * @param {EmitterShowOpts} opts - The show options.
   * @param opts.level - Controls display of log level (boolean, number for truncation, or 'icon')
   * @param opts.timestamp - Controls timestamp format ('iso', 'elapsed', 'time', or boolean)
   * @param opts.sid - Controls display of session ID (boolean or number for truncation)
   * @param opts.reqId - Controls display of request ID (boolean or number for truncation)
   * @param opts.pkg - Controls display of package name (boolean or number for truncation)
   * @param opts.data - Controls display of structured data (boolean)
   * @param opts.time - Controls display of response time (boolean)
   * @param opts.pkgSep - Separator between package names (string, defaults to '.')
   * @returns {this} The instance of LogMgr.
   */
  public set show(opts: Log.EmitterShowOpts) {
    if (!isStrictEmitterShowOpts(opts)) {
      throw new Error('Invalid show options');
    }
    this.#show = opts;
    this.transportMgr.show(opts);
  }

  public get show(): Log.EmitterShowOpts {
    return this.#show;
  }

  /**
   * Retrieves the root logger instance.
   *
   * @remarks
   * On the first call, this method initializes the `LogMgr` with default
   * factories (if `initLevels()` has not been called), sets up a default console
   * transport, and starts the logging queue. Subsequent calls return the
   * existing root logger.
   *
   * @example
   * ```ts
   * const logMgr = new Log.Mgr();
   * // Specify the expected logger type for type safety.f
   * const logger = await logMgr.getLogger<Log.Std.Logger>();
   * logger.info.text('Hello').emit();
   * ```
   *
   * @template L - The expected type of the logger, which must extend `Logger.IEmitter`.
   * @returns {L} The root logger instance.
   */
  public async getLogger<L extends Logger.ILoggerEmitter>(params: Log.IGetChildParams = {}): Promise<L> {
    if (!this.#rootLogger) {
      this.initLevels();
      this.#rootLogger = this.#loggerFactories.createLogger(this, params);
    }
    if (!this.transportMgr.transports.length) {
      // const consoleOpts: Transport.Console.Options = {
      //   logLevels: this.logLevels,
      //   show: this.show,
      //   startTime: this.startTime,
      //   threshold: this.threshold,
      // };
      const transport = new Transport.Console.Transport(this, {});
      await this.transportMgr.add(transport);
    }
    if (!this.transportMgr.isRunning()) {
      await this.start();
    }
    return this.#rootLogger as L;
  }

  /**
   * @internal
   * Creates a new message builder instance for a given log level. This is called by the logger and
   * does not need to be called by a user.
   *
   * @remarks
   * This method creates a lightweight MsgEmitter that captures the logger's context and has a direct
   * reference to the TransportMgr, allowing the MsgBuilder to emit directly to transports without
   * going through the Logger and LogMgr.
   *
   * @param {string} level - The log level for the message.
   * @param {Logger.ILoggerEmitter} emitter - The logger instance that provides context.
   * @returns {M} A new message builder instance.
   */
  public getMsgBuilder(level: string, emitter: Logger.ILoggerEmitter): M {
    assert(this.#logLevels, 'Log levels not yet initialized');
    const levelSpec = this.#logLevels.asSpec(level);
    assert(levelSpec, `Invalid level ${level}`);

    // Progress mode is enabled when:
    // 1. The level matches the LogMgr threshold exactly
    // 2. There's at least one Console transport that can show progress
    const threshold = this.#threshold;
    const levelMatchesThreshold = (threshold && levelSpec.severity === threshold.severity) ? true : false;
    const hasProgressTransport = this.transportMgr.hasProgressCapableTransport();
    const progressEnabled = levelMatchesThreshold && hasProgressTransport;

    // Create a lightweight emitter that captures context and emits directly to TransportMgr
    const opts: Log.LogEmitterOpts = {
      level: levelSpec,
      context: {
        sid: emitter.sid,
        reqId: emitter.reqId,
        pkgs: emitter.pkgs,
        pkgSep: this.#show.pkgSep || '.',
      },
      msgSep: emitter.msgSep ?? this.#show.msgSep ?? 1,
      transportMgr: this.transportMgr,
      progressEnabled,
      demark: emitter.demark ? (name: string, keep?: boolean) => emitter.demark!(name, keep ?? false) : undefined,
    };

    const msgEmitter = new MsgEmitter(opts);

    return this.#msgBuilderFactory(msgEmitter) as unknown as M;
  }

  /**
   * Gets the start time of the LogMgr instance.
   * @returns {Date} The start time.
   */
  get startTime(): DateTime {
    return this.#t0;
  }

  async addTransport(transport: Transport.Base.Transport): Promise<void> {
    assert(this.#logLevels, 'Log Manager must be initialized before adding transports.');
    if (this.transportMgr.isRunning()) {
      this.emit({
        level: this.#logLevels.warnLevel,
        msg: `Log Manager is already running. Transport ${transport.toString()} is now active for new messages.`,
      });
    }
    await this.transportMgr.add(transport);
  }

  async removeTransport(transport: Transport.Base.Transport): Promise<void> {
    await this.transportMgr.remove(transport);
  }

  /**
   * @internal
   */
  async start(): Promise<void> {
    if (this.#bRunning) {
      this.emit({
        level: this.logLevels.warnLevel,
        msg: 'Start called on Log Manager that is already running.',
      });
      return;
    }
    await this.transportMgr.start();
    this.#bRunning = true;
  }

  /**
   * @internal
   */
  async stop(): Promise<void> {
    if (!this.#bRunning) {
      this.emit({
        level: this.logLevels.warnLevel,
        msg: 'Stop called on Log Manager that is not running.',
      });
      return;
    }
    await this.transportMgr.stop();
    this.#bRunning = false;
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
   * @internal
   * Emits a log message. This is called by the
   * Logger implementation which, in turn, is called by the {@link IMsgBuilder}
   * implementation.
   * @param {Entry} msg - The log message to emit.
   */
  public emit(msg: Log.Entry): void {
    if (this.transportMgr.meetsAnyThreshold(msg.level)) {
      if (!msg.timestamp) {
        msg.timestamp = DateTime.now();
      }
      this.transportMgr.emit(msg);
    }
  }

  /**
   * Emits a log message without checking log level thresholds. This is only used internally.
   * @param {Entry} msg - The log message to emit.
   * @internal
   */
  forceEmit(msg: Log.Entry): void {
    this.transportMgr.emit(msg);
  }

  /**
   * Gets the log levels that we are using. The ILogLevels is set when we choose
   * a logger (eg. with the getLogger method).
   * @returns {ILogLevels} The log levels.
   * @throws Will throw an error if log levels are not set.
   */
  get logLevels(): Level.LogLevels {
    assert(this.#logLevels, 'LogLevels not set for Logger. Call initLevels() first.');
    return this.#logLevels;
  }

  /**
   * Same as logLevels.asSpec except throws if val is not valid
   */
  asSpec(val: Level.Spec | Level.Name | Level.Severity): Level.Spec {
    const result = this.logLevels.asSpec(val);
    if (!result) {
      throw new Error(`Invalid log level ${val}`);
    }
    return result;
  }
}
