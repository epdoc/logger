import type { HrMilliseconds } from '@epdoc/duration';
import { isDict, isString } from '@epdoc/type';
import { assert } from '@std/assert/assert';
import type { Level } from '../levels/index.ts';
import type { LogMgr } from '../logmgr.ts';
import * as MsgBuilder from '../message/index.ts';
import type * as Log from '../types.ts';
import type * as Logger from './types.ts';

let markId = 0;

/**
 * Base Logger class, to be inherited by loggers that implement their own log
 * level methods.
 */

export class Base<M extends MsgBuilder.IBasic>
  implements Logger.IEmitter, Logger.IMark, Logger.ILevels, Logger.IInherit {
  protected _logMgr: LogMgr<M>;
  protected _threshold: Level.Value | undefined;
  protected _show: Log.EmitterShowOpts = {};
  protected _pkg: string[] = [];
  protected _reqId: string[] = [];
  protected _sid: string | undefined;
  protected _mark: Record<string, HrMilliseconds> = {};

  constructor(logMgr: LogMgr<M>) {
    this._logMgr = logMgr;
  }

  // static factoryMethod<M>(logMgr: LogMgr<M>): Basic<M> {
  //   return new Basic<M>(logMgr);
  // }

  getChild(opts?: Log.GetChildOpts): Base<M> {
    const logger = this.copy();
    if (isDict(opts)) {
      if (opts.reqId) {
        logger._reqId.push(opts.reqId);
      }
      if (opts.sid) {
        logger._sid = opts.sid;
      }
      if (opts.pkg) {
        logger._pkg.push(opts.pkg);
      }
    }
    return logger;
  }

  copy(): Base<M> {
    const result = new Base<M>(this._logMgr);
    result.assign(this);
    return result;
  }

  assign(logger: Base<M>) {
    this._threshold = logger._threshold;
    this._show = logger._show;
    this._pkg = [...logger._pkg];
    this._reqId = [...logger._reqId];
  }

  emit(msg: Log.Entry): void {
    if (this.meetsThreshold(msg.level) && msg.msg) {
      if (isString(msg.msg)) {
        console.log(msg.msg);
      } else if (msg.msg instanceof MsgBuilder.Basic) {
        console.log(msg.msg.format(false, MsgBuilder.Format.text));
      }
    }
  }

  get package(): string {
    return this._pkg.join('.');
  }

  set package(val: string) {
    this._pkg.push(val);
  }

  get sid(): string | undefined {
    return this._sid;
  }

  set sid(val: string | undefined) {
    this._sid = val;
  }

  setPackage(val: string | undefined): this {
    if (val) {
      this._pkg.push(val);
    }
    return this;
  }

  get reqId(): string {
    return this._reqId.join('.');
  }

  set reqId(val: string) {
    this._reqId.push(val);
  }

  setReqId(val: string | undefined): this {
    if (val) {
      this._reqId.push(val);
    }
    return this;
  }

  get logLevels(): Level.IBasic {
    return this._logMgr.logLevels;
  }

  get logMgr(): LogMgr<M> {
    return this._logMgr;
  }

  // get threshold(): Level.Value {
  //   if (isDefined(this._threshold)) {
  //     return this._threshold as Level.Value;
  //   }
  //   return this._logMgr.threshold;
  // }

  /**
   * Can set threshold on a per-Logger basis. But usually we set it at the
   * LogMgr or Transport.
   * @param level
   * @returns
   */
  setThreshold(level: Level.Name | Level.Value): this {
    this._threshold = this.logLevels.asValue(level);
    return this;
  }

  meetsThreshold(level: Level.Value | Level.Name, threshold?: Level.Value | Level.Name): boolean {
    if (threshold !== undefined) {
      return this.logLevels.meetsThreshold(level, threshold);
    }
    return this._logMgr.meetsThreshold(level, this._threshold);
  }

  meetsFlushThreshold(level: Level.Value | Level.Name): boolean {
    return this.logLevels.meetsFlushThreshold(level);
  }

  mark(): string {
    const name = 'mark.' + ++markId;
    this._mark[name] = performance.now();
    return name;
  }

  demark(name: string, keep = false): HrMilliseconds {
    assert(this._mark[name], `No mark set for ${name}`);
    const result = performance.now() - this._mark[name];
    if (keep !== true) {
      delete this._mark[name];
    }
    return result;
  }
}
