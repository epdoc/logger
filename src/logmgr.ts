import type { HrMilliseconds } from '@epdoc/duration';
import { isNonEmptyString } from '@epdoc/type';
import { assert } from '@std/assert';
import { cli, ILogLevels, type LevelName, LogLevel, std } from './levels/index.ts';
import { Logger } from './logger.ts';
import { createConsoleTransport, ITransport } from './transports/index.ts';
import type { LogEmitterShowOpts, LogRecord } from './types.ts';

export class LogMgr {
  protected _t0: Date = new Date();
  protected _type: string | undefined;
  protected _logLevels: ILogLevels | undefined;
  protected _threshold: LogLevel = 5;
  protected _show: LogEmitterShowOpts = {};
  protected _pkg: string = '';
  protected _reqId: string = '';
  protected _mark: Record<string, HrMilliseconds> = {};
  protected _registeredLoggers: Record<string, (logMgr: LogMgr) => Logger> = {
    cli: cli.getLogger,
    std: std.getLogger,
  };
  // protected _registeredTransports = {
  //   console: ConsoleTransport,
  // };
  protected _registeredLogLevels: Record<string, () => ILogLevels> = {
    cli: cli.createLogLevels,
    std: std.createLogLevels,
  };
  protected _transports: ITransport[] = [];

  constructor(type?: string) {
    this._transports = [createConsoleTransport(this)];
    if (isNonEmptyString(type)) {
      assert(this._registeredLoggers[type], `No logger for ${type} levels`);
      assert(this._registeredLogLevels[type], `No levels for ${type}`);
      this._type = type;
      this._logLevels = this._registeredLogLevels[type]();
    }
  }

  get startTime(): Date {
    return this._t0;
  }

  setShow(opts: LogEmitterShowOpts): this {
    this._show = opts;
    return this;
  }

  getShow(): LogEmitterShowOpts {
    return this._show;
  }

  getLogger(type?: string): Logger {
    this._type = type ? type : this._type;
    assert(
      this._type,
      `Logger type not specified (try one of ${Object.keys(this._registeredLoggers).join(', ')})`
    );
    assert(this._registeredLoggers[this._type], `No logger for ${type} levels`);
    assert(this._registeredLogLevels[this._type], `No levels for ${type}`);
    this._logLevels = this._registeredLogLevels[this._type]();
    return this._registeredLoggers[this._type](this);
  }

  emit(msg: LogRecord, logger: Logger): void {
    if (this.meetsThreshold(msg.level)) {
      this._transports.forEach((transport) => {
        transport.emit(msg, logger);
      });
    }
  }

  get logLevels(): ILogLevels {
    assert(this._logLevels, 'LogLevels not set for Logger');
    return this._logLevels as ILogLevels;
  }

  get threshold(): LogLevel {
    return this._threshold;
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

  setFlushThreshold(level: LogLevel | LevelName): boolean {
    return this.logLevels.meetsFlushThreshold(level);
  }
}
