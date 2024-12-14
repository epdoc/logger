import { dateEx } from '@epdoc/datetime';
import { duration } from '@epdoc/duration';
import { StringEx } from '@epdoc/string';
import { type Integer, isNonEmptyString } from '@epdoc/type';
import type { LevelName } from '../levels/index.ts';
import { Logger } from '../logger.ts';
import { LogMgr } from '../logmgr.ts';
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

    if (show.level === true) {
      parts.push(this.styledLevel(msg.level));
    }

    if (show.package === true && isNonEmptyString(msg.package)) {
      parts.push(this.styledPackage(msg.package, msg.level));
    }

    if (show.reqId === true && isNonEmptyString(logger.reqId)) {
      parts.push(this.styledPackage(logger.reqId, msg.level));
    }

    parts.push(msg.msg);

    if (msg.data) {
      parts.push(JSON.stringify(msg.data));
    }

    console.log(...parts);
  }

  styledLevel(level: LevelName): string {
    const s = '[' + StringEx(level).rightPad(7) + ']';
    return this._logMgr.logLevels.applyColors(s, level);
  }

  styledPackage(pkg: string, level: LevelName): string {
    let s = pkg;
    if (this._pkgWidth) {
      s = StringEx(pkg).leftPad(this._pkgWidth);
    }
    return this._logMgr.logLevels.applyColors(`(${s})`, level);
  }

  styledReqId(reqId: string, level: LevelName): string {
    let s = reqId;
    if (this._reqIdWidth) {
      s = StringEx(reqId).leftPad(this._reqIdWidth);
    }
    return this._logMgr.logLevels.applyColors(`(${s})`, level);
  }
}
