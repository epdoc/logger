import { DateRanges } from '@epdoc/daterange';
import { dateEx } from '@epdoc/datetime';
import { type FileSpec, type FolderSpec, FSError } from '@epdoc/fs';
import {
  builder,
  type GetChildOpts,
  type ILogEmitter,
  type LoggerFactoryMethod,
  LogMgr,
  std,
} from '../mod.ts';
import { asError, isString } from '@epdoc/type';
import os from 'node:os';
import { relative } from 'node:path';

const home = os.userInfo().homedir;

export class MsgBuilder extends builder.Console.MsgBuilder {
  // msg(msg: Message): this {
  //   return this.stylize(builder.Console.styleFormatters.label, msg.idOrPath()).stylize(
  //     builder.Console.styleFormatters.date,
  //     '(' + msg.dateAsString() + ')'
  //   );
  // }
  // mdate(msg: Message): this {
  //   return this.date('(' + msg.dateAsString() + ')');
  // }

  section(str: string): this {
    const len = (80 - str.length) / 2;
    return this.h1('-'.repeat(Math.floor(len)))
      .h1(str)
      .h1('-'.repeat(Math.ceil(len)));
  }
  pl(num: number, singular: string, plural?: string): this {
    return this.value(num + ' ' + (num === 1 ? singular : plural ? plural : singular + 's'));
  }

  fs(path: string | FileSpec | FolderSpec): this {
    const s = '~/' + relative(home, isString(path) ? path : path.path);
    return this.path(s);
  }
  // labelDiff(diff: gapi.label.Diff): this {
  //   const names: gapi.label.NameDiffs = diff.asLabelNameDiff();
  //   if (names.add.length) {
  //     this.text('add').value(names.add.join(','));
  //   }
  //   if (names.rm.length) {
  //     this.text('remove').value(names.rm.join(','));
  //   }
  //   return this;
  // }
  dateRange(dateRanges: DateRanges | undefined): this {
    if (dateRanges) {
      dateRanges.ranges.forEach((range) => {
        const bBefore = range.before && range.before < new Date() ? true : false;
        this.label(bBefore ? 'from' : 'after').date(
          range.after ? dateEx(range.after).format('yyyy/MM/dd HH:mm:ss') : '2000'
        );
        if (bBefore) {
          this.label('to').date(dateEx(range.before).format('yyyy/MM/dd HH:mm:ss'));
        }
      });
    }
    return this;
  }

  err(error: unknown, stack = false): this {
    const err = asError(error);
    this.error(err.message);
    if (err.cause) {
      this.label('cause:').value(err.cause);
    }
    if (err instanceof FSError && err.path) {
      this.fs(err.path);
    }
    if (stack && this.emitter.meetsThreshold('debug')) {
      this.text('\n' + err.stack);
    }
    return this;
  }
}

export const getLogger: LoggerFactoryMethod = (log: LogMgr | ILogEmitter, opts: GetChildOpts = {}) => {
  if (log instanceof LogMgr) {
    return new Logger(log).setReqId(opts.reqId).setPackage(opts.pkg);
  } else if (log instanceof Logger) {
    return log.getChild(opts);
  }
  throw new Error('Invalid logger type');
};

export class Logger extends std.IndentLogger implements std.ILogger {
  override getChild(opts: GetChildOpts = {}) {
    const logger = this.copy();
    if (opts.reqId) {
      logger._reqId.push(opts.reqId);
    }
    if (opts.pkg) {
      logger._reqId.push(opts.pkg);
    }
    return logger;
  }

  override copy(): Logger {
    const result = new Logger(this._logMgr);
    result.assign(this);
    return result;
  }

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
  /**
   * A spam message is for developers to through super verbose comments that
   * should otherwise be commented out.
   * @returns A message builder for the TRACE level.
   */
  get spam(): MsgBuilder {
    return new MsgBuilder('SPAM', this);
  }
}

export const logMgr = new LogMgr();
logMgr.registerLogger('finsync', getLogger, std.createLogLevels);
export const log: Logger = logMgr.getLogger('finsync') as Logger;
logMgr.setThreshold('info');
