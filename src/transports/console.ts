import { dateEx } from '@epdoc/datetime';
import { duration } from '@epdoc/duration';
import { StringEx } from '@epdoc/string';
import { type Integer, isInteger, isNonEmptyString } from '@epdoc/type';
import type { Level } from '../levels/index.ts';
import type * as Logger from '../logger/basic.ts';
import type { LogMgr } from '../logmgr.ts';
import * as MsgBuilder from '../message/index.ts';
import type * as Log from '../types.ts';
import { Basic } from './basic.ts';
import type * as Transport from './types.ts';

export function createConsole(logMgr: LogMgr) {
  return new Console(logMgr);
}

export class Console extends Basic implements Transport.IBasic {
  protected _pkgWidth: Integer = 0;
  protected _reqIdWidth: Integer = 0;
  protected _levelWidth: Integer = 5;

  set packageWidth(val: Integer) {
    this._pkgWidth = val;
  }

  override thresholdUpdated(): this {
    this._levelWidth = this._logMgr.logLevels.maxWidth(this._logMgr.threshold);
    return this;
  }

  emit(msg: Log.Entry, logger: Logger.Basic) {
    const parts: string[] = [];

    const logLevels = this._logMgr.logLevels;
    const show = this._logMgr.getShow();

    if (show.timestamp === 'utc' && msg.timestamp) {
      parts.push(logLevels.applyColors(msg.timestamp.toISOString(), msg.level));
    } else if (show.timestamp === 'local' && msg.timestamp) {
      parts.push(logLevels.applyColors(dateEx(msg.timestamp).toISOLocalString(), msg.level));
    } else if (show.timestamp === 'elapsed' && msg.timestamp) {
      parts.push(
        logLevels.applyColors(
          duration().narrow.format(msg.timestamp.getTime() - this._logMgr.startTime.getTime()),
          msg.level,
        ),
      );
    }

    if (show.level) {
      parts.push(logLevels.applyColors(this.styledLevel(msg.level, show.level), msg.level));
    }

    if (show.package && isNonEmptyString(msg.package)) {
      parts.push(this.styledPackage(msg.package, show.package));
    }

    if (show.reqId && isNonEmptyString(logger.reqId)) {
      parts.push(this.styledReqId(logger.reqId, show.reqId));
    }

    parts.push(msg.msg);

    if (msg.data) {
      parts.push(JSON.stringify(msg.data));
    }

    console.log(...parts);
  }

  styledPackage(val: string, show: boolean | Integer): string {
    return this._styledString(val, show, '_package');
  }

  styledReqId(val: string, show: boolean | Integer): string {
    return this._styledString(val, show, '_reqId');
  }

  styledLevel(level: Level.Name, show: boolean | Integer): string {
    let s = StringEx(level).rightPad(this._levelWidth);
    if (isInteger(show)) {
      if (show > 0) {
        s = StringEx(level).rightPad(show, ' ', true);
      } else if (show < 0) {
        s = StringEx(level).leftPad(0 - show, ' ', true);
      }
    }
    s = '[' + s + ']';
    return this._logMgr.logLevels.applyColors(s, level);
    // return styleFormatters._level(s);
  }

  _styledString(
    val: string,
    show: boolean | number,
    colorFn: string,
    opts?: { pre: string; post: string },
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
    if (MsgBuilder.Console.styleFormatters[colorFn]) {
      return MsgBuilder.Console.styleFormatters[colorFn](s);
    }
    return s;
  }
}
