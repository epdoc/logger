import { dateEx } from '@epdoc/datetime';
import { duration } from '@epdoc/duration';
import type { LevelName } from '@epdoc/levels';
import { std } from '@epdoc/levels';
import * as core from '@epdoc/logcore';
import { MsgBuilder } from '@epdoc/msgconsole';
import { StringEx } from '@epdoc/string';
import { type Integer, isNonEmptyString, isNumber, isString } from '@epdoc/type';
import type { ILogger } from './levels.ts';

export class Logger extends core.Logger implements ILogger, core.ILoggerIndent {
  protected _t0: Date = new Date();
  protected _pkgWidth: Integer = 0;
  protected _indent: string[] = [];

  constructor() {
    super();
    this._logLevels = std.createLogLevels();
    this._threshold = this._logLevels.asValue(this._logLevels.defaultLevelName);
  }

  startTime(d: Date): this {
    this._t0 = d;
    return this;
  }

  override emit(msg: core.LogRecord): void {
    if (this.meetsThreshold(msg.level)) {
      const parts: string[] = [];
      if (this._show.timestamp === 'utc' && msg.timestamp) {
        parts.push(this.logLevels.applyColors(msg.timestamp.toISOString(), msg.level));
      } else if (this._show.timestamp === 'local' && msg.timestamp) {
        parts.push(this.logLevels.applyColors(dateEx(msg.timestamp).toISOLocalString(), msg.level));
      } else if (this._show.timestamp === 'elapsed' && msg.timestamp) {
        parts.push(
          this.logLevels.applyColors(
            duration().narrow.format(msg.timestamp.getTime() - this._t0.getTime()),
            msg.level,
          ),
        );
      }
      if (this._show.level === true) {
        parts.push(this.styledLevel(msg.level));
      }
      if (this._show.package === true && isNonEmptyString(this._pkg)) {
        parts.push(this.styledPackage(this._pkg, msg.level));
      }
      if (this._indent.length) {
        parts.push(...this._indent);
      }
      parts.push(msg.msg);
      if (msg.data) {
        parts.push(JSON.stringify(msg.data));
      }
      console.log(...parts);
    }
  }

  styledPackage(pkg: string, level: LevelName): string {
    let s = pkg;
    if (this._pkgWidth) {
      s = StringEx(pkg).leftPad(this._pkgWidth);
    }
    return this.logLevels.applyColors(`(${s})`, level);
  }

  styledLevel(level: LevelName): string {
    const s = '[' + StringEx(level).rightPad(7) + ']';
    return this.logLevels.applyColors(s, level);
  }

  indent(n?: number | string): this {
    if (isString(n)) {
      this._indent.push(n);
    } else if (isNumber(n)) {
      for (let x = 0; x < n; ++x) {
        this._indent.push(' ');
      }
    } else {
      this._indent.push(' ');
    }
    return this;
  }

  outdent(n: number = 1): this {
    for (let x = 0; x < n; ++x) {
      this._indent.pop();
    }
    return this;
  }

  nodent(): this {
    this._indent = [];
    return this;
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
