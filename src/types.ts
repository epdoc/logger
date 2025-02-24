import { isString } from '@epdoc/type';
import type * as Level from './levels/types.ts';
import type * as MsgBuilder from './message/index.ts';

const REG = {
  timeopt: /^(utc|local|elapsed)$/i,
};

export type TimeOpt = 'utc' | 'local' | 'elapsed';

export function isTimeOpt(val: unknown): val is TimeOpt {
  return isString(val) && REG.timeopt.test(val) ? true : false;
}

export type Entry = {
  level: Level.Name;
  timestamp?: Date;
  sid?: string;
  reqId?: string;
  package?: string;
  // msg?: string;
  msg: string | MsgBuilder.IFormat | undefined;
  data?: Record<string, unknown>;
};

export type EmitterShowOpts = {
  level?: boolean | number;
  timestamp?: TimeOpt;
  sid?: boolean;
  reqId?: boolean | number;
  package?: boolean | number;
  data?: boolean;
};
export type EmitterShowKey = keyof EmitterShowOpts;

export interface IEmitter {
  emit(msg: Entry): void;
}
