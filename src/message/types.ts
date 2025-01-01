import { type Integer } from '@epdoc/type';
import type { LevelName } from '../levels/types.ts';
import type { ILogEmitter, LogRecord, StyleArg } from '../types.ts';

export interface IMsgBuilder {
  set level(level: LevelName);
  set emitter(emitter: ILogEmitter);
  get emitter(): ILogEmitter;
  clear(): this;
  setInitialString(...args: StyleArg[]): this;
  indent(n: Integer | string): this;
  tab(n: Integer): this;
  comment(...args: string[]): this;
  data(data: Record<string, unknown>): this;
  emit(): LogRecord;
}

// export type MsgBuilderFactoryMethod = (level: LevelName, emitter?: ILogEmitter) => IMsgBuilder;
