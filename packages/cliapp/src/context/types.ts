import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import type { DenoPkg } from '../types.ts';

export interface IBase<
  M extends Console.Builder = Console.Builder,
  L extends Log.IEmitter = Log.Std.Logger<M>,
> {
  log: L;
  logMgr: Log.Mgr<M>;
  dryRun: boolean;
  pkg: DenoPkg;
  close(): Promise<void>;
}
