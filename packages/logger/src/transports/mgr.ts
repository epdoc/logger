import type * as Log from '$log';
import type * as Level from '@epdoc/loglevels';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { assert } from '@std/assert';
import type { LogMgr } from '../logmgr.ts';
import type { AbstractTransport } from './base/transport.ts';
import { ConsoleTransport } from './console/transport.ts';
/**
 * Manages a collection of log transports, handling the distribution of log
 * entries to each registered transport.
 */
export class TransportMgr {
  protected _bRunning = false;
  protected _logMgr: LogMgr<MsgBuilder.Abstract>;
  /**
   * An array of registered transport instances.
   */
  transports: AbstractTransport[] = [];

  /**
   * Creates an instance of the `TransportMgr`.
   * @param {LogMgr<MsgBuilder.Abstract>} logMgr - The log manager instance.
   */
  constructor(logMgr: LogMgr<MsgBuilder.Abstract>) {
    this._logMgr = logMgr;
  }

  /**
   * Sets the log level threshold for all registered transports.
   *
   * @param {Level.Name | Level.Value} level - The log level to set.
   * @returns {this} The current instance for method chaining.
   */
  setThreshold(level: Level.Name | Level.Value): this {
    const threshold = this._logMgr.logLevels.asValue(level);
    this.transports.forEach((transport) => {
      transport.setThreshold(threshold);
    });
    return this;
  }

  /**
   * Checks if any transport meets the specified log level threshold.
   *
   * @param {Level.Value} levelVal - The numerical value of the log level.
   * @returns {boolean} `true` if any transport meets the threshold, otherwise `false`.
   */
  meetsAnyThresholdValue(levelVal: Level.Value): boolean {
    assert(this.transports.length, 'No transports');
    return this.transports.some((transport) => {
      return transport.meetsThresholdValue(levelVal);
    });
  }

  /**
   * Configures the display options for all registered transports.
   *
   * @param {Log.EmitterShowOpts} opts - The display options to set.
   * @returns {this} The current instance for method chaining.
   */
  show(opts: Log.EmitterShowOpts): this {
    this.transports.forEach((transport) => {
      transport.show(opts);
    });
    return this;
  }

  /**
   * Starts all registered transports.
   *
   * If no transports are registered, a default `Console` transport is added.
   *
   * @returns {Promise<void>} A promise that resolves when all transports have started.
   */
  start(): Promise<void> {
    if (!this.transports.length) {
      const transport = new ConsoleTransport(this._logMgr);
      this.transports.push(transport);
    }
    const jobs: Promise<void>[] = [];
    this.transports.forEach((transport) => {
      jobs.push(transport.setup());
    });
    return Promise.all(jobs).then(() => {
      this._bRunning = true;
      return;
    });
  }

  /**
   * Indicates whether the transport manager is running.
   * @returns {boolean} `true` if running, otherwise `false`.
   */
  get running(): boolean {
    return this._bRunning;
  }

  /**
   * Checks if all transports are ready.
   * @returns {boolean} `true` if all transports are ready, otherwise `false`.
   */
  allReady(): boolean {
    return this.transports.every((t) => t.ready);
  }

  /**
   * Adds a new transport to the manager.
   *
   * @param {AbstractTransport<any>} transport - The transport instance to add.
   */
  add(transport: AbstractTransport) {
    this._bRunning = false;
    this.transports.unshift(transport);
    this._bRunning = true;
  }

  /**
   * Removes a transport from the manager.
   *
   * @param {AbstractTransport<any>} transport - The transport instance to remove.
   * @returns {Promise<void>} A promise that resolves when the transport is removed.
   */
  async remove(transport: AbstractTransport): Promise<void> {
    this._bRunning = false;
    const name = transport.toString();
    const found = this.transports.find((t) => {
      return t.match(transport);
    });
    if (found) {
      await found.destroy();
    }
    this.transports = this.transports.filter((t) => {
      return t.alive;
    });
    const msg: Log.Entry = {
      level: 'info',
      pkg: 'logger.transport.remove',
      msg: `Removed transport '${name}'`,
    };

    this.emit(msg);
  }

  /**
   * Stops all registered transports.
   *
   * @returns {Promise<void>} A promise that resolves when all transports have stopped.
   */
  async stop(): Promise<void> {
    const jobs: Promise<void>[] = [];
    this.transports.forEach((transport) => {
      jobs.push(transport.stop());
    });
    await Promise.all(jobs);
  }

  /**
   * Emits a log entry to all registered transports.
   *
   * @param {Log.Entry} msg - The log entry to emit.
   */
  emit(msg: Log.Entry): void {
    for (const transport of this.transports) {
      transport.emit(msg);
    }
  }
}
