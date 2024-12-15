import { isNumber, isString } from '@epdoc/type';
import { Logger as CoreLogger } from '../../logger.ts';
import { LogMgr } from '../../logmgr.ts';
import { MsgBuilder } from '../../message/index.ts';
import { ILoggerIndent, LogRecord } from '../../types.ts';
import type { ILogger } from './types.ts';

export function getLogger(logMgr: LogMgr) {
  return new Logger(logMgr);
}

/**
 * Logger that implements STD levels. These levels are:
 *  - error
 *  - warn
 *  - info
 *  - debug
 *  - verbose
 *  - trace
 */

export class Logger extends CoreLogger implements ILogger, ILoggerIndent {
  protected _t0: Date = new Date();
  protected _indent: string[] = [];

  constructor(logMgr: LogMgr) {
    super(logMgr);
  }

  startTime(d: Date): this {
    this._t0 = d;
    return this;
  }

  override emit(msg: LogRecord): void {
    if (this.meetsThreshold(msg.level)) {
      // Compose the message string
      const parts: string[] = [];
      if (this._indent.length) {
        parts.push(...this._indent);
      }
      parts.push(msg.msg);
      if (msg.data) {
        parts.push(JSON.stringify(msg.data));
      }
      msg.msg = parts.join(' ');

      // Hand off emitting to LogMgr, which will direct to all transports

      this._logMgr.emit(msg, this);
    }
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
