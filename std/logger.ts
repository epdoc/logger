import { dateEx } from '@epdoc/datetime';
import { duration, type HrMilliseconds } from '@epdoc/duration';
import type { ILoggerThresholds, ILogLevels, LevelName, LogLevel } from '@epdoc/levels';
import { std } from '@epdoc/levels';
import type { ILogEmitter, ILoggerIndent, ILoggerMark, LogEmitterShowOpts, LogRecord } from '@epdoc/message';
import { MsgBuilder } from '@epdoc/msgconsole';
import { StringEx } from '@epdoc/string';
import { type Integer, isNonEmptyString, isNumber, isString } from '@epdoc/type';
import { assert } from '@std/assert/assert';
import type { ILogger } from './levels.ts';

export class Logger implements ILogger, ILogEmitter, ILoggerMark, ILoggerIndent, ILoggerThresholds {
  protected _t0: Date = new Date();
  protected _logLevels: ILogLevels;
  protected _threshold: LogLevel;
  protected _show: LogEmitterShowOpts = {};
  protected _pkg: string = '';
  protected _pkgWidth: Integer = 0;
  protected _indent: string[] = [];
  protected _mark: Record<string, HrMilliseconds> = {};

  constructor() {
    this._logLevels = std.createLogLevels();
    this._threshold = this._logLevels.asValue(this._logLevels.defaultLevelName);
  }

  startTime(d: Date): this {
    this._t0 = d;
    return this;
  }

  setThreshold(level: LevelName | LogLevel): this {
    this._threshold = this._logLevels.asValue(level);
    return this;
  }

  meetsThreshold(level: LogLevel | LevelName, threshold?: LogLevel | LevelName): boolean {
    const t = threshold ? this._logLevels.asValue(threshold) : this._threshold;
    return this._logLevels.meetsThreshold(level, t);
  }

  meetsFlushThreshold(level: LogLevel | LevelName): boolean {
    return this._logLevels.meetsFlushThreshold(level);
  }

  emit(msg: LogRecord): void {
    if (this._logLevels.meetsThreshold(msg.level, this._threshold)) {
      const parts: string[] = [];
      if (this._show.timestamp === 'utc' && msg.timestamp) {
        parts.push(this._logLevels.applyColors(msg.timestamp.toISOString(), msg.level));
      } else if (this._show.timestamp === 'local' && msg.timestamp) {
        parts.push(this._logLevels.applyColors(dateEx(msg.timestamp).toISOLocalString(), msg.level));
      } else if (this._show.timestamp === 'elapsed' && msg.timestamp) {
        parts.push(
          this._logLevels.applyColors(
            duration().narrow.format(msg.timestamp.getTime() - this._t0.getTime()),
            msg.level
          )
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

  show(opts: LogEmitterShowOpts): this {
    this._show = opts;
    return this;
  }

  setPackage(val: string, width: Integer = 0): this {
    this._pkg = val;
    this._pkgWidth = width;
    return this;
  }

  styledPackage(pkg: string, level: LevelName): string {
    let s = pkg;
    if (this._pkgWidth) {
      s = StringEx(pkg).leftPad(this._pkgWidth);
    }
    return this._logLevels.applyColors(`(${s})`, level);
  }

  styledLevel(level: LevelName): string {
    const s = '[' + StringEx(level).rightPad(7) + ']';
    return this._logLevels.applyColors(s, level);
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
