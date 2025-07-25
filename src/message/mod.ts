import { AbstractMsgBuilder } from './abstract.ts';
import { ConsoleMsgBuilder, type ErrOpts, type IConsole } from './console.ts';
import type {
  ClassConstructor,
  IBasic,
  IEmitDuration,
  MsgBuidlerFactoryMethod,
  MsgPart,
  StyleArg,
  StyleFormatterFn,
} from './types.ts';

export const MsgBuilder = {
  Base: AbstractMsgBuilder,
  Console: ConsoleMsgBuilder,
};
export interface MsgBuilder<M extends IBasic> {
  ErrOpts: ErrOpts;
  IConsole: IConsole;
  StyleFormatterFn: StyleFormatterFn;
  IBasic: IBasic;
  MsgPart: MsgPart;
  StyleArg: StyleArg;
  IEmitDuration: IEmitDuration;
  FactoryMethod: MsgBuidlerFactoryMethod;
  ClassConstructor: ClassConstructor<M>;
}
