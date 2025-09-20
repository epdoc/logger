import * as MsgBuilder from '$msgbuilder';

export class CustomMsgBuilder extends MsgBuilder.Console.Builder {
  myCustomMethod(text: string): this {
    return this.text(`Custom: ${text}`);
  }
}

export const customMsgBuilderFactory: MsgBuilder.FactoryMethod = (
  emitter: MsgBuilder.IEmitter,
): CustomMsgBuilder => {
  return new CustomMsgBuilder(emitter);
};
