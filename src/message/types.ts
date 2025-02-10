import type { Integer } from '@epdoc/type';
import type { Name } from '../levels/types.ts';
import type * as Log from '../types.ts';

export interface ICore {
  set level(level: Name);
  set emitter(emitter: Log.IEmitter);
  get emitter(): Log.IEmitter;
  clear(): this;
  setInitialString(...args: Log.StyleArg[]): this;
  indent(n: Integer | string): this;
  tab(n: Integer): this;
  comment(...args: string[]): this;
  data(data: Record<string, unknown>): this;
  emit(): Log.Entry;
}

// export type MsgBuilderFactoryMethod = (level: LevelName, emitter?: ILogEmitter) => IMsgBuilder;
