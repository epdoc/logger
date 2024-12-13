import type { HrMilliseconds } from '@epdoc/duration';
import type { ILogLevels, LevelName, LogLevel } from '@epdoc/levels';
import { cli, type ILoggerThresholds } from '@epdoc/levels';
import type { ILogEmitter, ILoggerMark, LogEmitterShowOpts, LogRecord } from '@epdoc/message';
import { MsgBuilder } from '@epdoc/msgconsole';
import { assert } from '@std/assert/assert';
import type { ILogger } from './cli.ts';

export class Logger implements ILogger, ILogEmitter, ILoggerMark, ILoggerThresholds {
  protected _logLevels: ILogLevels;
  protected _threshold: LogLevel;
  protected _show: LogEmitterShowOpts = {};
  protected _pkg: string = '';
  protected _mark: Record<string, HrMilliseconds> = {};

  constructor() {
    this._logLevels = cli.createLogLevels();
    this._threshold = this._logLevels.asValue(this._logLevels.defaultLevelName);
  }

  show(opts: LogEmitterShowOpts): this {
    this._show = opts;
    return this;
  }

  emit(msg: LogRecord): void {
    if (this._logLevels.meetsThreshold(msg.level, this._threshold)) {
      console.log(msg.msg);
    }
  }

  setPackage(val: string): this {
    this._pkg = val;
    return this;
  }

  setThreshold(level: LevelName | LogLevel): this {
    this._threshold = this._logLevels.asValue(level);
    return this;
  }

  meetsThreshold(level: LogLevel | LevelName, threshold?: LogLevel | LevelName): boolean {
    return this._logLevels.meetsThreshold(level, threshold ? threshold : this._threshold);
  }

  meetsFlushThreshold(level: LogLevel | LevelName): boolean {
    return this._logLevels.meetsFlushThreshold(level);
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

  get error(): MsgBuilder {
    return new MsgBuilder('ERROR', this);
  }
  get warn(): MsgBuilder {
    return new MsgBuilder('WARN', this);
  }
  get help(): MsgBuilder {
    return new MsgBuilder('HELP', this);
  }
  get data(): MsgBuilder {
    return new MsgBuilder('DATA', this);
  }
  get info(): MsgBuilder {
    return new MsgBuilder('INFO', this);
  }
  get debug(): MsgBuilder {
    return new MsgBuilder('DEBUG', this);
  }
  get prompt(): MsgBuilder {
    return new MsgBuilder('PROMPT', this);
  }
  get verbose(): MsgBuilder {
    return new MsgBuilder('VERBOSE', this);
  }
  get input(): MsgBuilder {
    return new MsgBuilder('INPUT', this);
  }
  get silly(): MsgBuilder {
    return new MsgBuilder('SILLY', this);
  }
}
