import type { ILogLevels, LevelName, LogLevel } from '@epdoc/levels';
import { type ILoggerThresholds, std } from '@epdoc/levels';
import type { ILogEmitter, LogMessage } from '@epdoc/message';
import { MsgBuilder } from '@epdoc/msgconsole';
import type { ILogger } from './levels.ts';

export class Logger implements ILogger, ILogEmitter, ILoggerThresholds {
  protected _logLevels: ILogLevels;
  protected _threshold: LogLevel;

  constructor() {
    this._logLevels = std.createLogLevels();
    this._threshold = this._logLevels.asValue(this._logLevels.defaultLevelName);
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

  emit(msg: LogMessage): void {
    if (this._logLevels.meetsThreshold(msg.level, this._threshold)) {
      if (msg.data) {
        const d = JSON.stringify(msg.data);
        console.log(msg.msg, d);
      } else {
        console.log(msg.msg);
      }
    }
  }

  /**
   * An error message indicates a serious problem in the system. The problem is
   * usually non-recoverable and requires manual intervention.
   * @returns A message builder for the ERROR level.
   */
  get error(): MsgBuilder {
    return new MsgBuilder('ERROR', this);
  }

  /**
   * A warning message indicates a potential problem in the system. the System
   * is able to handle the problem by themself or to proccede with this problem
   * anyway.
   * @returns A message builder for the WARN level.
   */
  get warn(): MsgBuilder {
    return new MsgBuilder('WARN', this);
  }

  /**
   * Info messages contain some contextual information to help trace execution
   * (at a coarse-grained level) in a production environment. For user-facing
   * applications, these are messages that the user is meant to see.
   * @returns A message builder for the INFO level.
   */
  get info(): MsgBuilder {
    return new MsgBuilder('INFO', this);
  }

  /**
   * A verbose message is also aimed at users, but contains more granular
   * information than an info message. Info messages tend to summarize progress,
   * while verbose messages spill all the details.
   * @returns A message builder for the VERBOSE level.
   */
  get verbose(): MsgBuilder {
    return new MsgBuilder('VERBOSE', this);
  }

  /**
   * Messages in this level  are mostly used for problem diagnosis. Information
   * on this Level are for Developers and not for the Users. This is an
   * appropriate level to dump stack trace information, where it exists.
   * @returns A message builder for the DEBUG level.
   */
  get debug(): MsgBuilder {
    return new MsgBuilder('DEBUG', this);
  }

  /**
   * A trace message is for developers to trace execution of the program,
   * usually to help during development.
   * @returns A message builder for the TRACE level.
   */
  get trace(): MsgBuilder {
    return new MsgBuilder('TRACE', this);
  }
}
