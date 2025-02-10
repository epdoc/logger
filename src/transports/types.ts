import type * as Logger from '../logger/basic.ts';
import type * as Log from '../types.ts';

export interface IBasic {
  emit(msg: Log.Entry, logger: Logger.Basic): void;
  thresholdUpdated(): IBasic;
}
