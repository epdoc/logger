import { isArray, isNumber, isString } from '@epdoc/type';
import type { LogMgr } from '../logmgr.ts';
import type * as Log from '../types.ts';
import { Basic } from './basic.ts';
import type * as Logger from './types.ts';

export class Indent<M> extends Basic<M> implements Logger.IIndent {
  protected _t0: Date = new Date();
  protected _indent: string[] = [];

  constructor(logMgr: LogMgr<M>) {
    super(logMgr);
  }

  // static override factoryMethod<M>(logMgr: LogMgr<M>): Basic<M> {
  //   return new Basic<M>(logMgr);
  // }

  startTime(d: Date): this {
    this._t0 = d;
    return this;
  }

  override assign(logger: Indent<M>) {
    super.assign(logger);
    this._t0 = logger._t0;
    this._indent = [...logger._indent];
  }

  override emit(msg: Log.Entry): void {
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

  indent(n?: number | string | string[]): this {
    if (isString(n)) {
      this._indent.push(n);
    } else if (isNumber(n)) {
      for (let x = 0; x < n; ++x) {
        this._indent.push(' ');
      }
    } else if (isArray(n)) {
      for (let x = 0; x < n.length; ++x) {
        this._indent.push(n[x]);
      }
    } else {
      this._indent.push(' ');
    }
    return this;
  }

  getdent(): string[] {
    return this._indent;
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
}
