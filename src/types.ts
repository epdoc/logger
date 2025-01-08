import type { HrMilliseconds } from '@epdoc/duration';
import { isString } from '@epdoc/type';
import { LogMgr } from './index.ts';
import type { LevelName } from './levels/types.ts';

const REG = {
  timeopt: /^(utc|local|elapsed)$/i,
};

export type StyleFormatterFn = (str: string) => string;
export type StyleArg = string | number | Record<string, unknown> | unknown[] | unknown;

export type LogMsgPart = {
  str: string;
  style?: StyleFormatterFn;
};

export type TimeOpt = 'utc' | 'local' | 'elapsed';

export function isTimeOpt(val: unknown): val is TimeOpt {
  return isString(val) && REG.timeopt.test(val) ? true : false;
}

export type LogRecord = {
  level: LevelName;
  timestamp?: Date;
  msg: string;
  data?: Record<string, unknown>;
  reqId?: string;
  package?: string;
};

export type LogEmitterShowOpts = {
  level?: boolean | number;
  timestamp?: TimeOpt;
  reqId?: boolean | number;
  package?: boolean | number;
};

export interface ILoggerIndent {
  indent(n?: number | string): this;
  outdent(n?: number): this;
  getdent(): string[];
  nodent(): this;
}

export interface ILoggerMark {
  mark(name: string): this;
  demark(name: string, keep: boolean): HrMilliseconds;
}

export type GetChildOpts = {
  reqId?: string;
  pkg?: string;
};

export interface ILogEmitter {
  emit(msg: LogRecord): void;
  // show(val: LogEmitterShowOpts): this;
  set package(val: string);
  get package(): string;
  set reqId(val: string);
  get reqId(): string;
  getChild(opts?: GetChildOpts): ILogEmitter;
}

export function isILoggerMark(val: object): val is ILoggerMark {
  return (<ILoggerMark> val).mark !== undefined;
}

export type LoggerFactoryMethod = (logMgr: LogMgr | ILogEmitter, opts?: GetChildOpts) => ILogEmitter;
