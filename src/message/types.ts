import type { Integer } from '@epdoc/type';
import type { Log } from '../../mod.ts';
import type { Level } from '../levels/index.ts';
import type * as Logger from '../logger/types.ts';
import type * as Transport from '../transports/types.ts';

export type StyleFormatterFn = (str: string) => string;
export type StyleArg = string | number | Record<string, unknown> | unknown[] | unknown;

export type MsgPart = {
  str: string;
  style?: StyleFormatterFn;
};

export interface IFormat {
  format(color: boolean, target: Transport.OutputFormat): string;
  appendMsgPart(str: string, style?: StyleFormatterFn | null): IFormat;
  prependMsgPart(str: string, style?: StyleFormatterFn | null): IFormat;
}

export interface IBasic {
  clear(): this;
  setInitialString(...args: StyleArg[]): this;
  indent(n: Integer | string): this;
  tab(n: Integer): this;
  comment(...args: string[]): this;
  data(data: Record<string, unknown>): this;
  emit(): Log.Entry | undefined;
}

export type FactoryMethod = (
  level: Level.Name,
  params: Log.IParams,
  emitter: Log.IEmitter,
  meetsThreshold: boolean,
  meetsFlushThreshold: boolean,
) => IBasic;

export type ClassConstructor<M> = new (level: string, logger: Logger.IEmitter) => M;
