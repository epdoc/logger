import type { HrMilliseconds } from '@epdoc/duration';
import type { Level } from '../levels/index.ts';
import type { LogMgr } from '../logmgr.ts';
import type * as Log from '../types.ts';

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

export interface IThresholds {
  setThreshold(level: Level.Name | Level.Value): IThresholds;
  meetsThreshold(level: Level.Value | Level.Name, threshold: Level.Value | Level.Name): boolean;
  meetsFlushThreshold(level: Level.Value | Level.Name): boolean;
}

export function isIMark(val: object): val is IMark {
  return (<IMark> val).mark !== undefined;
}

export type FactoryMethod = (logMgr: LogMgr | Log.IEmitter, opts?: Log.GetChildOpts) => Log.IEmitter;
