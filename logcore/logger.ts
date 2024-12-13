import type { HrMilliseconds } from '@epdoc/duration';
import type { ILoggerThresholds, ILogLevels, LevelName, LogLevel } from '@epdoc/levels';
import { assert } from '@std/assert/assert';
import type { ILogEmitter, ILoggerMark, LogEmitterShowOpts, LogRecord } from './types.ts';

export class Logger implements ILogEmitter, ILoggerMark, ILoggerThresholds {
  protected _logLevels: ILogLevels | undefined;
  protected _threshold: LogLevel = 5;
  protected _show: LogEmitterShowOpts = {};
  protected _pkg: string = '';
  protected _reqId: string = '';
  protected _mark: Record<string, HrMilliseconds> = {};

  constructor() {}

  show(opts: LogEmitterShowOpts): this {
    this._show = opts;
    return this;
  }

  emit(msg: LogRecord): void {
    if (this.meetsThreshold(msg.level)) {
      console.log(msg.msg);
    }
  }

  get package(): string {
    return this._pkg;
  }

  set package(val: string) {
    this._pkg = val;
  }

  setPackage(val: string): this {
    this._pkg = val;
    return this;
  }

  get reqId(): string {
    return this._reqId;
  }

  set reqId(val: string) {
    this._reqId = val;
  }

  setReqId(val: string): this {
    this._reqId = val;
    return this;
  }

  get logLevels(): ILogLevels {
    assert(this._logLevels, 'LogLevels not set for Logger');
    return this._logLevels as ILogLevels;
  }

  setThreshold(level: LevelName | LogLevel): this {
    this._threshold = this.logLevels.asValue(level);
    return this;
  }

  meetsThreshold(level: LogLevel | LevelName, threshold?: LogLevel | LevelName): boolean {
    if (threshold) {
      return this.logLevels.meetsThreshold(level, threshold);
    }
    assert(this._threshold, 'Log threshold not set');
    return this.logLevels.meetsThreshold(level, this._threshold);
  }

  meetsFlushThreshold(level: LogLevel | LevelName): boolean {
    return this.logLevels.meetsFlushThreshold(level);
  }

  mark(name: string): this {
    this._mark[name] = performance.now();
    return this;
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
