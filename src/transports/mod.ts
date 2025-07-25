import { TransportMgr } from './mgr.ts';

import type { BaseOptions } from './abstract.ts';

import type { AbstractMsgBuilder } from '../message/abstract.ts';
import { AbstractTransport } from './abstract.ts';
import { type ConsoleOptions, ConsoleTransport } from './console.ts';
import type { CreateOpts, Entry, FCallback, IStaticMsgBuilder, OpenCallbacks } from './types.ts';

export const Transport = {
  Base: AbstractTransport,
  Console: ConsoleTransport,
  Mgr: TransportMgr,
};
export interface Transport<M extends AbstractMsgBuilder> {
  BaseOptions: BaseOptions;
  OpenCallbacks: OpenCallbacks;
  FCallback: FCallback;
  CreateOpts: CreateOpts;
  IStaticMsgBuilder: IStaticMsgBuilder;
  Entry: Entry;
  Console: {
    Options: ConsoleOptions;
  };
}
