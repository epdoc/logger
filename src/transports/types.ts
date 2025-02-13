import type * as Logger from '../logger/index.ts';
import type * as MsgBuilder from '../message/index.ts';
import type * as Log from '../types.ts';

export interface IBasic<M extends MsgBuilder.IBasic> {
  emit(msg: Log.Entry, logger: Logger.IEmitter): void;
  thresholdUpdated(): IBasic<M>;
}
