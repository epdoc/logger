import { assert } from '@std/assert';
import type { Level } from '../levels/index.ts';
import type { LogMgr } from '../logmgr.ts';
import type * as MsgBuilder from '../message/index.ts';
import type * as Log from '../types.ts';
import type { Base } from './base.ts';
import { Console } from './console.ts';

export class TransportMgr<M extends MsgBuilder.IBasic = MsgBuilder.Console> implements Log.IEmitter {
  protected _bRunning = false;
  protected _logMgr: LogMgr<M>;
  transports: Base<M>[] = [];

  constructor(logMgr: LogMgr<M>) {
    this._logMgr = logMgr;
  }

  setThreshold(level: Level.Name | Level.Value): this {
    const threshold = this._logMgr.logLevels.asValue(level);
    this.transports.forEach((transport) => {
      transport.setThreshold(threshold);
      // transport.thresholdUpdated();
    });
    return this;
  }

  meetsAnyThresholdValue(levelVal: Level.Value): boolean {
    assert(this.transports.length, 'No transports');
    return this.transports.some((transport) => {
      return transport.meetsThresholdValue(levelVal);
    });
  }

  setShow(opts: Log.EmitterShowOpts): this {
    this.transports.forEach((transport) => {
      transport.setShow(opts);
      // transport.thresholdUpdated();
    });
    return this;
  }
  start(): Promise<void> {
    if (!this.transports.length) {
      const transport = new Console(this._logMgr);
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

  get running() {
    return this._bRunning;
  }

  allReady(): boolean {
    return this.transports.every((t) => t.ready);
  }

  add(transport: Base<M>) {
    this._bRunning = false;
    this.transports.unshift(transport);
    const name = transport.toString();
    const topts = transport.getOptions();
    this._logMgr._rootEmit('verbose', 'logger.transport.add', `Added transport '${name}'`, {
      transport: name,
      options: topts,
    });
    this._bRunning = true;
    // this.setThreshold(5);
  }

  async remove(transport: Base<M>): Promise<void> {
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
      package: 'logger.transport.remove',
      msg: `Removed transport '${name}'`,
    };

    this.emit(msg);
  }

  async stop(): Promise<void> {
    const jobs: Promise<void>[] = [];
    this.transports.forEach((transport) => {
      jobs.push(transport.stop());
    });
    await Promise.all(jobs);
  }

  emit(msg: Log.Entry): void {
    for (const transport of this.transports) {
      transport.emit(msg);
    }
  }

  // emit(level: string, pkg: string, msg: string, data?: Dict | unknown[]): void {
  //   const entry: Log.Entry = {
  //     level: level,
  //     package: pkg,
  //     data: data,
  //     msg: msg,
  //   };
  //   this._logMgr.emit(entry, this._rootLogger as Logger.IEmitter);
  // }
}
