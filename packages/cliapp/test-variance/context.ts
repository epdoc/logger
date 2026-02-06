/**
 * Simulates @epdoc/cliapp context types
 */

import type { Console } from './msgbuilder.ts';
import type { LogMgr, StdLogger } from './logger.ts';

// ICtx interface - no default on M
export interface ICtx<M extends Console.Builder, L = StdLogger<M>> {
  log: L;
  logMgr: LogMgr<M>;
}

// Context class WITH DEFAULT
export abstract class Context<
  M extends Console.Builder = Console.Builder,  // DEFAULT
  L extends StdLogger<M> = StdLogger<M>
> implements ICtx<M, L> {
  log!: L;
  logMgr!: LogMgr<M>;
}
