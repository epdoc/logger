import type { HrMilliseconds } from '@epdoc/duration';
import { isDefined, isDict } from '@epdoc/type';
import { assert } from '@std/assert/assert';
import type { ILoggerThresholds, ILogLevels, LevelName, LogLevel } from './levels/index.ts';
import { LogMgr } from './logmgr.ts';
import { GetChildOpts, ILogEmitter, ILoggerMark, LogEmitterShowOpts, LogRecord } from './types.ts';

/**
 * Base Logger class, to be inherited by loggers that implement their own log
 * level methods.
 */

export class Logger implements ILogEmitter, ILoggerMark, ILoggerThresholds {
  protected _logMgr: LogMgr;
  protected _threshold: LogLevel | undefined;
  protected _show: LogEmitterShowOpts = {};
  protected _pkg: string[] = [];
  protected _reqId: string[] = [];
  protected _mark: Record<string, HrMilliseconds> = {};

  constructor(logMgr: LogMgr) {
    this._logMgr = logMgr;
  }

  getChild(opts?: GetChildOpts): Logger {
    const logger = this.copy();
    if (isDict(opts)) {
      if (opts.reqId) {
        logger._reqId.push(opts.reqId);
      }
      if (opts.pkg) {
        logger._pkg.push(opts.pkg);
      }
    }
    return logger;
  }

  copy(): Logger {
    const result = new Logger(this._logMgr);
    result.assign(this);
    return result;
  }

  assign(logger: Logger) {
    this._threshold = logger._threshold;
    this._show = logger._show;
    this._pkg = [...logger._pkg];
    this._reqId = [...logger._reqId];
  }

  emit(msg: LogRecord): void {
    if (this.meetsThreshold(msg.level)) {
      console.log(msg.msg);
    }
  }

  get package(): string {
    return this._pkg.join('.');
  }

  set package(val: string) {
    this._pkg.push(val);
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

  get logLevels(): ILogLevels {
    return this._logMgr.logLevels;
  }

  get threshold(): LogLevel {
    if (isDefined(this._threshold)) {
      return this._threshold as LogLevel;
    }
    return this._logMgr.threshold;
  }

  /**
   * Can set threshold on Logger or LogMgr level
   * @param level
   * @returns
   */
  setThreshold(level: LevelName | LogLevel): this {
    this._threshold = this.logLevels.asValue(level);
    return this;
  }

  meetsThreshold(level: LogLevel | LevelName, threshold?: LogLevel | LevelName): boolean {
    if (threshold !== undefined) {
      return this.logLevels.meetsThreshold(level, threshold);
    }
    return this._logMgr.meetsThreshold(level, this.threshold);
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
