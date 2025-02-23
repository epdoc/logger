import { dateEx } from '@epdoc/datetime';
import { duration } from '@epdoc/duration';
import { isNonEmptyString, isValidDate } from '@epdoc/type';
import type { Level } from '../levels/index.ts';
import type { LogMgr } from '../logmgr.ts';
import type * as MsgBuilder from '../message/index.ts';
import * as Log from '../types.ts';

export interface BaseOptions {
  show?: Log.EmitterShowOpts;
}

export abstract class Base<M extends MsgBuilder.IBasic> {
  public readonly type: string = 'basic';
  protected _logMgr: LogMgr<M>;
  protected _bReady = false;
  protected _opts: BaseOptions;
  protected _level: Level.Value; // = Level.Value.debug;
  protected _threshold: Level.Value;
  protected _flushThreshold: Level.Value;
  protected _show: Log.EmitterShowOpts = {};

  constructor(logMgr: LogMgr<M>, opts: BaseOptions = {}) {
    this._logMgr = logMgr;
    this._opts = opts;
    this._level = logMgr.logLevels.asValue('info');
    this._threshold = logMgr.threshold;
    this._flushThreshold = logMgr.logLevels.asValue('warn');
    this._show = opts.show ?? logMgr.show;
  }

  getOptions(): BaseOptions {
    return this._opts;
  }

  setThreshold(level: Level.Name | Level.Value): this {
    this._threshold = this._logMgr.logLevels.asValue(level);
    this.thresholdUpdated();
    return this;
  }

  show(opts: Log.EmitterShowOpts): this {
    Object.keys(opts).forEach((key) => {
      const k: Log.EmitterShowKey = key as Log.EmitterShowKey;
      if (opts[k] === true || opts[k] === false || isNonEmptyString(opts[k])) {
        // @ts-ignore this is okay
        this._show[k] = opts[k];
      }
    });
    return this;
  }

  meetsThresholdValue(level: Level.Value): boolean {
    if (this._threshold === undefined) {
      return true;
    }
    return this._logMgr.logLevels.meetsThresholdValue(level, this._threshold);
  }

  msgMeetsThreshold(msg: Log.Entry): boolean {
    const levelValue = this._logMgr.logLevels.asValue(msg.level);
    return this._logMgr.logLevels.meetsThresholdValue(levelValue, this._threshold);
  }

  meetsFlushThresholdValue(level: Level.Value): boolean {
    return this._logMgr.logLevels.meetsThresholdValue(level, this._threshold);
  }

  thresholdUpdated(): Base<M> {
    return this;
  }

  dateToString(d: Date | undefined, format: Log.TimeOpt | undefined): string | undefined {
    if (isValidDate(d) && Log.isTimeOpt(format)) {
      if (format === 'utc') {
        return d.toISOString();
      } else if (format === 'local') {
        return dateEx(d).toISOLocalString();
      } else if (format === 'elapsed') {
        return duration().narrow.format(d.getTime() - this._logMgr.startTime.getTime());
      }
    }
  }

  get ready(): boolean {
    return this._bReady;
  }

  setup(): Promise<void> {
    return Promise.resolve();
  }

  stop(): Promise<void> {
    return Promise.resolve();
  }

  destroy(): Promise<void> {
    return Promise.resolve();
  }

  emit(msg: Log.Entry): void {
    if (this.msgMeetsThreshold(msg)) {
      // do nothing
    }
  }

  // pick(msg: Log.Entry): Partial<Log.Entry> {
  //   const show = this._logMgr.getShow();
  //   const result: Partial<Log.Entry> = { msg: msg.msg };
  //   if (show.level) {
  //     result.level = msg.level;
  //   }
  //   if (show.package && msg.package) {
  //     result.package = msg.package;
  //   }
  //   if (show.reqId && msg.reqId) {
  //     result.reqId = msg.reqId;
  //   }
  //   if (show.sid && msg.sid) {
  //     result.sid = msg.sid;
  //   }
  //   if (show.timestamp && msg.timestamp) {
  //     result.timestamp = this.dateToString(msg.timestamp, show.timestamp);
  //   }
  //   return result;
  // }

  // abstract log(msg: string): void;

  match(transport: Base<M>): boolean {
    if (this.type === transport.type) {
      return true;
    }
    return false;
  }

  close(): Promise<void> {
    return Promise.resolve();
  }

  clear(): void {}
  get alive(): boolean {
    return false;
  }
}
