import { isString } from '@epdoc/type';
import type * as Level from './levels/types.ts';
import type * as MsgBuilder from './message/index.ts';

export const TimestampFormat = {
  UTC: 'utc',
  LOCAL: 'local',
  ELAPSED: 'elapsed',
} as const;

export type TimestampFormat = typeof TimestampFormat[keyof typeof TimestampFormat];

const timestampFormatValues = Object.values(TimestampFormat);

export function isTimestampFormat(val: unknown): val is TimestampFormat {
  return isString(val) && (timestampFormatValues as readonly string[]).includes(val);
}

export type Entry = {
  level: Level.Name;
  timestamp?: Date;
  sid?: string;
  reqId?: string;
  package?: string;
  // msg?: string;
  msg: string | MsgBuilder.IFormat | undefined;
  data?: unknown | undefined;
};

export type EmitterShowOpts = {
  level?: boolean | number;
  timestamp?: TimestampFormat;
  sid?: boolean;
  reqId?: boolean | number;
  package?: boolean | number;
  data?: boolean;
};
export type EmitterShowKey = keyof EmitterShowOpts;

export interface IEmitter {
  emit(msg: Entry): void;
}
