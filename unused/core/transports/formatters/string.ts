import { StringEx } from '../../../../message/util.ts';
import type { LogMgr } from '../../core/logmgr.ts';
import type { LogMessage, LogMsgPart, StyleFormatterFn } from '../../types.ts';
import type { TransportFormatter } from './base.ts';

export function getNewFormatter(logMgr: LogMgr): TransportFormatter {
  return new TransportStringFormatter(logMgr);
}

class TransportStringFormatter extends TransportFormatter {
  get name(): string {
    return 'string';
  }

  format(msg: LogMessage): string {
    this._msg = msg;
    this.addTimePrefix()
      .addLevelPrefix()
      .addMsgConst('reqId')
      .addMsgConst('sid')
      .addMsgConst('emitter')
      .addMsgConst('action')
      // .addSuffix()
      .addElapsed();
    return this.formatParts();
  }

  protected addTimePrefix() {
    const timePrefix = this._showOpts.timestamp;
    if (timePrefix) {
      const time = this.getTimeString();
      this.addMsgPart(time, this.style.getDefFromName('timePrefix'));
    }
    return this;
  }

  protected addLevelPrefix(): this {
    if (this._showOpts.level) {
      const levelAsString = this.logLevels.asName(this._msg.level);
      // const styleName = `_${levelAsString.toLowerCase()}Prefix` as StyleName;
      // const formattedLevel = styleName;
      const str = `[${levelAsString.toUpperCase()}]`;
      // this.addMsgPart(util.rightPadAndTruncate(str, 9), styleName);
      this.addMsgPart(StringEx(str).rightPadAndTruncate(9), this.style.getDefFromName('levelPrefx'));
    }
    return this;
  }

  // protected addPlain(...args: any[]): this {
  //   this.addMsgPart(args.join(' '), '_plain');
  //   return this;
  // }

  // protected addSuffix(): this {
  //   this.addMsgPart(this._msg.suffix.join(' '), this._formatOpts.suffix);
  //   return this;
  // }

  protected addElapsed(): this {
    if (this._showOpts.elapsed && this._msg.timer) {
      this.addMsgPart(
        `${this._msg.timer.getTimeForPrefix('elapsed')} (${this._msg.timer.getTimeForPrefix('interval')})`,
        this.style.getDefFromName('elapsed'),
      );
      // this.stylize('_elapsed', `${et.total} (${et.interval})`);
    }
    return this;
  }

  protected addMsgConst(name: string): this {
    if (this._showOpts[name]) {
      this.addMsgPart(this._msg[name], this._formatOpts[name]);
    }
    return this;
  }

  protected addMsgPart(str: string, style?: StyleFormatterFn): this {
    // const _style = this.stylizeEnabled ? style : undefined;
    this._msg.parts.push({ str: str, style: style });
    return this;
  }

  protected formatParts(): string {
    let parts: string[] = [];
    this._msg.parts.forEach((part: LogMsgPart) => {
      if (part.style) {
        parts.push(part.style(part.str as unknown as string[]));
      } else {
        parts.push(part.str);
      }
    });
    return parts.join(' ');
  }
}
