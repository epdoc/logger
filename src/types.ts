import { isString } from '@epdoc/type';
import type * as Level from './levels/types.ts';

const REG = {
  timeopt: /^(utc|local|elapsed)$/i,
};

export type StyleFormatterFn = (str: string) => string;
export type StyleArg = string | number | Record<string, unknown> | unknown[] | unknown;

export type MsgPart = {
  str: string;
  style?: StyleFormatterFn;
};

export type TimeOpt = 'utc' | 'local' | 'elapsed';

export function isTimeOpt(val: unknown): val is TimeOpt {
  return isString(val) && REG.timeopt.test(val) ? true : false;
}

export type Entry = {
  level: Level.Name;
  timestamp?: Date;
  msg: string;
  data?: Record<string, unknown>;
  reqId?: string;
  package?: string;
};

export type EmitterShowOpts = {
  level?: boolean | number;
  timestamp?: TimeOpt;
  reqId?: boolean | number;
  package?: boolean | number;
  // Show source code file and line number
  source?: boolean;
};

export type GetChildOpts = {
  reqId?: string;
  pkg?: string;
};
