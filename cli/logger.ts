import type { ILogLevels, LevelName, LogLevel } from '@epdoc/levels';
import { cli, type ILoggerThresholds } from '@epdoc/levels';
import type { ILogEmitter, LogMessage } from '@epdoc/message';
import { MsgBuilder } from '@epdoc/msgconsole';
import type { ILogger } from './cli.ts';

export class Logger implements ILogger, ILogEmitter, ILoggerThresholds {
  protected _logLevels: ILogLevels;
  protected _threshold: LogLevel;
  protected _showLevel: boolean = true;

  constructor() {
    this._logLevels = cli.createLogLevels();
    this._threshold = this._logLevels.asValue(this._logLevels.defaultLevelName);
  }

  showLevel(show: boolean = true): this {
    this._showLevel = show;
    return this;
  }

  emit(msg: LogMessage): void {
    if (this._logLevels.meetsThreshold(msg.level, this._threshold)) {
      console.log(msg.msg);
    }
  }

  setThreshold(level: LevelName | LogLevel): this {
    this._threshold = this._logLevels.asValue(level);
    return this;
  }

  meetsThreshold(level: LogLevel | LevelName, threshold: LogLevel | LevelName): boolean {
    return this._logLevels.meetsThreshold(level, threshold);
  }

  meetsFlushThreshold(level: LogLevel | LevelName): boolean {
    return this._logLevels.meetsFlushThreshold(level);
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
