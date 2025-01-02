import { dateEx } from '@epdoc/datetime';
import { duration } from '@epdoc/duration';
import { StringEx } from '@epdoc/string';
import { type Integer, isInteger, isNonEmptyString } from '@epdoc/type';
import type { LevelName } from '../levels/index.ts';
import { Logger } from '../logger.ts';
import { LogMgr } from '../logmgr.ts';
import { styleFormatters } from '../message/console.ts';
import type { LogRecord } from '../types.ts';
import { type ITransport, Transport } from './transport.ts';

export function createConsoleTransport(logMgr: LogMgr) {
  return new ConsoleTransport(logMgr);
}

export class ConsoleTransport extends Transport implements ITransport {
  protected _pkgWidth: Integer = 0;
  protected _reqIdWidth: Integer = 0;

  set packageWidth(val: Integer) {
    this._pkgWidth = val;
  }

  emit(msg: LogRecord, logger: Logger) {
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
      parts.push(this.styledLevel(msg.level, show.level));
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

  styledLevel(level: LevelName, show: boolean | Integer): string {
    const w = this._logMgr.logLevels.maxWidth(this._logMgr.threshold);
    let s = StringEx(level).rightPad(w);
    if (isInteger(show)) {
      if (show > 0) {
        s = StringEx(level).rightPad(show, ' ', true);
      } else if (show < 0) {
        s = StringEx(level).leftPad(0 - show, ' ', true);
      }
    }
    s = '[' + s + ']';
    return styleFormatters._level(s);
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
    if (styleFormatters[colorFn]) {
      return styleFormatters[colorFn](s);
    }
    return s;
  }
}
