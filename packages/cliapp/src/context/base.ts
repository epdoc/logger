import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import type { DenoPkg } from '../types.ts';
import type * as Ctx from './types.ts';

export abstract class BaseContext<
  M extends Console.Builder = Console.Builder,
  L extends Log.IEmitter = Log.Std.Logger<M>,
> implements Ctx.IBase<M, L> {
  log!: L; // Will be set in setupLogging
  logMgr!: Log.Mgr<M>;
  dryRun = false;
  pkg: DenoPkg;

  constructor(pkg?: DenoPkg) {
    this.pkg = pkg || { name: 'unknown', version: '0.0.0', description: '' };
    // Don't call setupLogging here - let user control when it happens
  }

  abstract setupLogging(): void;

  async close() {
    await this.logMgr?.close();
  }
}
