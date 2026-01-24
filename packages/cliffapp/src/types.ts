/**
 * @file Core types for Cliffy integration
 */

import type { Log } from './dep.ts';
import type { Console } from '@epdoc/msgbuilder';

export type MsgBuilder = Console.Builder;
export type Logger<M extends MsgBuilder = MsgBuilder> = Log.Std.Logger<M>;

export interface ICtx<M extends MsgBuilder = MsgBuilder, L extends Logger<M> = Logger<M>> {
  log: L;
  logMgr: Log.Mgr<M>;
  dryRun: boolean;
  pkg: {
    name: string;
    version: string;
    description?: string;
  };
  close: () => Promise<void>;
}

export interface GlobalLogOptions {
  log?: string;
  logShow?: string[]; // Cliffy uses camelCase for options like --log-show
  color?: boolean;
  showall?: boolean;
  verbose?: boolean;
  debug?: boolean;
  trace?: boolean;
  spam?: boolean;
}
