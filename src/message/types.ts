import type { Integer } from '@epdoc/type';
import type { Level } from '../levels/index.ts';
import type { Name } from '../levels/types.ts';
import type * as Logger from '../logger/types.ts';
import type * as Log from '../types.ts';

export interface IBasic {
  set level(level: Name);
  set emitter(emitter: Logger.IEmitter);
  get emitter(): Logger.IEmitter;
  clear(): this;
  setInitialString(...args: Log.StyleArg[]): this;
  indent(n: Integer | string): this;
  tab(n: Integer): this;
  comment(...args: string[]): this;
  data(data: Record<string, unknown>): this;
  emit(): Log.Entry;
}

export type FactoryMethod = (level: Level.Name, emitter?: Logger.IEmitter) => IBasic;

export type ClassConstructor<M> = new (level: string, logger: Logger.IEmitter) => M;
