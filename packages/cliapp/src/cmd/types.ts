/**
 * @file Type definitions for the structured command system
 *
 * This file contains type definitions that enable automatic type extraction,
 * which simplifies generic type management in CLI applications.
 */

import type { ExtractMsgBuilder } from '../context/types.ts';

/**
 * A type bundle that automatically extracts MsgBuilder and Logger types from Context.
 *
 * This pattern reduces the number of generic parameters in command classes,
 * making the API much cleaner and easier to use by inferring types from the context.
 *
 * @template Ctx - The application context type (must have a 'log' property)
 *
 * @example Basic usage
 * ```typescript
 * class AppBuilder extends Console.Builder {
 *   fileOp(path: string) { return this.text(path); }
 * }
 * type Logger = Log.Std.Logger<AppBuilder>;
 *
 * class AppContext extends CliApp.Ctx.Base<Logger> { }
 *
 * // ContextBundle automatically extracts types
 * type AppBundle = ContextBundle<AppContext>;
 * // Expands to: { Context: AppContext; MsgBuilder: AppBuilder; Logger: Logger }
 *
 * class MyCmd extends CliApp.Cmd.Sub<AppContext, MyOptions> {
 *   // Can access this.ctx.log.info.fileOp('/path').emit()
 * }
 * ```
 *
 * @example Before (verbose - 3 type parameters)
 * ```typescript
 * type OldBundle = ContextBundle<AppContext, AppBuilder, Logger>;
 * ```
 *
 * @example After (simple - 1 type parameter, rest inferred)
 * ```typescript
 * type NewBundle = ContextBundle<AppContext>;
 * ```
 */
export type ContextBundle<Ctx extends { log: unknown }> = {
  /** The application context type */
  Context: Ctx;
  /** The message builder type extracted from the logger */
  MsgBuilder: ExtractMsgBuilder<Ctx['log']>;
  /** The logger type extracted from the context */
  Logger: Ctx['log'];
};
