import * as Log from '../../packages/logger/src/mod.ts';

export class CustomMsgBuilder extends Log.MsgBuilder.Console.Builder {
  myCustomMethod(text: string): this {
    return this.text(`Custom: ${text}`);
  }
}

export const customMsgBuilderFactory: Log.MsgBuilder.FactoryMethod = (
  level: Log.Level.Name,
  emitter: Log.IEmitter,
  meetsThreshold: boolean = true,
  meetsFlushThreshold: boolean = true,
): CustomMsgBuilder => {
  return new CustomMsgBuilder(level, emitter, meetsThreshold, meetsFlushThreshold);
};
