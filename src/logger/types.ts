import type { HrMilliseconds } from '@epdoc/duration';
import type { Level } from '../levels/index.ts';
import type { LogMgr } from '../logmgr.ts';
import type * as MsgBuilder from '../message/index.ts';
import type * as Log from '../types.ts';

export interface IInherit {
  copy(): IInherit;
  assign(logger: this): void;
  getChild(opts?: Log.GetChildOpts): IInherit;
}

export interface IEmitter {
  emit(msg: Log.Entry): void;
  // show(val: LogEmitterShowOpts): this;
  set pkg(val: string);
  get pkg(): string;
  set reqId(val: string);
  get reqId(): string;
  sid: string | undefined;
  meetsThreshold(level: Level.Value | Level.Name, threshold?: Level.Value | Level.Name): boolean;
}

export interface IIndent {
  indent(n?: number | string): this;
  outdent(n?: number): this;
  getdent(): string[];
  nodent(): this;
}

export interface IMark {
  mark(): string;
  demark(name: string, keep: boolean): HrMilliseconds;
}

export interface ILevels {
  get logLevels(): Level.IBasic;
  setThreshold(level: Level.Name | Level.Value): ILevels;
  meetsThreshold(level: Level.Value | Level.Name, threshold: Level.Value | Level.Name): boolean;
  meetsFlushThreshold(level: Level.Value | Level.Name): boolean;
}

export function isIMark(val: object): val is IMark {
  return (<IMark> val).mark !== undefined;
}

export type FactoryMethod<M extends MsgBuilder.IBasic> = (
  logMgr: LogMgr<M> | IEmitter,
  opts?: Log.IParams,
) => IEmitter;
