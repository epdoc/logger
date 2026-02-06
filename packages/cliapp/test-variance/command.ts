/**
 * Simulates @epdoc/cliapp BaseCommand
 */

import type { Console } from './msgbuilder.ts';  // TYPE-ONLY import
import type { ICtx } from './context.ts';

export abstract class BaseCommand<
  TContext extends TParentContext,
  TParentContext extends ICtx<Console.Builder>,
> {
  ctx!: TContext;
}
