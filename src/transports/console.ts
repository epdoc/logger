import { StringEx } from '@epdoc/string';
import { type Integer, isInteger, isNonEmptyString, isString, pick } from '@epdoc/type';
import type { Level } from '../levels/index.ts';
import type { LogMgr } from '../logmgr.ts';
import * as MsgBuilder from '../message/index.ts';
import type * as Log from '../types.ts';
import { Base, type BaseOptions } from './base.ts';
import type * as Transport from './types.ts';

// export function factoryMethod<M extends MsgBuilder.IBasic>(
//   logMgr: LogMgr<M>,
//   opts: HandlerOptions
// ): Handler<M> {
//   return new Handler<M>(logMgr, opts);
// }

export type ConsoleOutputFormat = 'text' | 'json' | 'jsonArray';

export interface ConsoleOptions extends BaseOptions {
  format?: ConsoleOutputFormat;
  color?: boolean;
}

export class Console<M extends MsgBuilder.IBasic> extends Base<M> {
  protected _levelWidth: Integer = 5;
  protected _format: ConsoleOutputFormat = 'text';
  protected _color: boolean = true;

  // static create<M extends MsgBuilder.IBasic>(logMgr: LogMgr<M>): Console<M> {
  //   return new Console<M>(logMgr);
  // }

  constructor(logMgr: LogMgr<M>, opts: ConsoleOptions = {}) {
    super(logMgr, opts);
    if (opts.format) {
      this._format = opts.format;
    }
    this._color = opts.color ?? true;
    this._bReady = true;
  }

  get useColor(): boolean {
    return this._color;
  }

  override toString(): string {
    return `Console[${this._format}]`;
  }

  override thresholdUpdated(): this {
    this._levelWidth = this._logMgr.logLevels.maxWidth(this._logMgr.threshold);
    return this;
  }

  override emit(msg: Log.Entry) {
    if (!this.msgMeetsThreshold(msg)) {
      return;
    }

    const show = this._logMgr.getShow();
    const logLevels = this._logMgr.logLevels;
    const color = this._color;

    const entry: Transport.Entry = Object.assign({}, pick(msg, 'level', 'package', 'sid', 'reqId', 'data'), {
      timestamp: this.dateToString(msg.timestamp, show.timestamp ?? 'local'),
    });

    entry.timestamp = this.dateToString(msg.timestamp, show.timestamp ?? 'local');
    if (msg.msg instanceof MsgBuilder.Base) {
      entry.msg = msg.msg.format(this._color, this._format);
    } else if (isString(msg.msg)) {
      entry.msg = msg.msg;
    }

    if (this._format === 'json') {
      this.output(JSON.stringify(entry));
    } else if (this._format === 'jsonArray') {
      const parts: (string | null | object)[] = [];
      if (entry.timestamp) {
        parts.push(color ? logLevels.applyColors(entry.timestamp, msg.level) : entry.timestamp);
      } else {
        parts.push(null);
      }
      parts.push(entry.level ? this.styledLevel(entry.level, show.level) : null);
      parts.push(entry.package ?? null);
      parts.push(entry.sid ?? null);
      parts.push(entry.reqId ?? null);
      parts.push(entry.msg ?? null);
      parts.push(entry.data ?? null);
      this.output(JSON.stringify(entry));
    } else {
      const parts: string[] = [];
      if (isString(entry.timestamp) && show.timestamp) {
        parts.push(color ? logLevels.applyColors(entry.timestamp, msg.level) : entry.timestamp);
      }

      if (show.level && entry.level) {
        parts.push(this.styledLevel(entry.level, show.level));
      }

      if (show.package && isNonEmptyString(entry.package)) {
        parts.push(entry.package);
      }

      if (show.sid && isNonEmptyString(entry.sid)) {
        parts.push(entry.sid);
      }

      if (show.reqId && isNonEmptyString(entry.reqId)) {
        parts.push(entry.reqId);
      }

      if (entry.msg) {
        parts.push(entry.msg);
      }

      if (msg.data && show.data) {
        parts.push(JSON.stringify(msg.data));
      }
      this.output(parts.join(' '));
    }
  }

  output(str: string): Promise<void> {
    console.log(str);
    return Promise.resolve();
  }

  styledLevel(level: Level.Name, show: boolean | Integer | undefined): string {
    let s = StringEx(level).rightPad(this._levelWidth);
    if (isInteger(show)) {
      if (show > 0) {
        s = StringEx(level).rightPad(show, ' ', true);
      } else if (show < 0) {
        s = StringEx(level).leftPad(0 - show, ' ', true);
      }
    }
    s = '[' + s + ']';
    if (this._color) {
      return this._logMgr.logLevels.applyColors(s, level);
    }
    return s;
  }

  _styledString(
    val: string,
    show: boolean | number,
    colorFn: string,
    opts?: { pre: string; post: string }
  ): string {
    let s = val;
    if (isInteger(show)) {
      if (show > 0) {
        s = StringEx(val).rightPad(show, ' ', true);
      } else if (show < 0) {
        s = StringEx(val).leftPad(0 - show, ' ', true);
      }
    }
    if (opts) {
      if (opts.pre) {
        s = opts.pre + s;
      }
      if (opts.post) {
        s += opts.post;
      }
    }
    if (this._color && MsgBuilder.Console.styleFormatters[colorFn]) {
      return MsgBuilder.Console.styleFormatters[colorFn](s);
    }
    return s;
  }
}
