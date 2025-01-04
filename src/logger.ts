import type { HrMilliseconds } from '@epdoc/duration';
import { isDefined } from '@epdoc/type';
import { assert } from '@std/assert/assert';
import type { ILoggerThresholds, ILogLevels, LevelName, LogLevel } from './levels/index.ts';
import { LogMgr } from './logmgr.ts';
import { ILogEmitter, ILoggerMark, LogEmitterShowOpts, LogRecord } from './types.ts';

/**
 * Base Logger class, to be inherited by loggers that implement their own log
 * level methods.
 */

export class Logger implements ILogEmitter, ILoggerMark, ILoggerThresholds {
  protected _logMgr: LogMgr;
  protected _threshold: LogLevel | undefined;
  protected _show: LogEmitterShowOpts = {};
  protected _pkg: string = '';
  protected _reqId: string[] = [];
  protected _mark: Record<string, HrMilliseconds> = {};

  constructor(logMgr: LogMgr) {
    this._logMgr = logMgr;
  }

  getChild(reqId?: string): Logger {
    const logger = new Logger(this._logMgr);
    logger._threshold = this._threshold;
    logger._show = this._show;
    logger._pkg = this._pkg;
    logger._reqId = this._reqId;
    if (reqId) {
      logger._reqId.push(reqId);
    }
    return logger;
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
