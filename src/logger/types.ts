import type { HrMilliseconds } from '@epdoc/duration';
import type { Level } from '../levels/index.ts';
import type { LogMgr } from '../logmgr.ts';
import type * as MsgBuilder from '../message/index.ts';
import type * as Log from '../types.ts';

export interface IInherit {
  copy(): IInherit;
  assign(logger: this): void;
  getChild(opts?: IGetChildParams): IInherit;
  get parent(): IInherit | undefined;
}

export interface IEmitter extends IMark {
  emit(msg: Log.Entry): void;
  // show(val: LogEmitterShowOpts): this;
  set pkg(val: string);
  get pkg(): string;
  get pkgs(): string[];
  set reqId(val: string);
  get reqId(): string;
  get reqIds(): string[];
  set sid(val: string);
  get sid(): string | undefined;
  set threshold(level: Level.Name | Level.Value);
  get threshold(): Level.Value;
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

export interface IGetChildParams {
  sid?: string;
  reqId?: string | string[];
  pkg?: string | string[];
}

export interface ILevels {
  get logLevels(): Level.IBasic;
  setThreshold(level: Level.Name | Level.Value): ILevels;
  set threshold(level: Level.Name | Level.Value);
  get threshold(): Level.Value;
  meetsThreshold(level: Level.Value | Level.Name, threshold: Level.Value | Level.Name): boolean;
  meetsFlushThreshold(level: Level.Value | Level.Name): boolean;
}

export function isIMark(val: object): val is IMark {
  return (<IMark> val).mark !== undefined;
}

export type FactoryMethod<M extends MsgBuilder.IBasic> = (
  logMgr: LogMgr<M> | IEmitter,
  opts?: IGetChildParams,
) => IEmitter;
