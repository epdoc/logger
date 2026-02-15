/**
 * @file Application lifecycle management
 * @description Provides standardized application execution with error handling,
 * signal management, and resource cleanup for CLI applications.
 * @module
 */

import * as _ from '@epdoc/type';
import type * as Cmd from './cmd/mod.ts';
import type * as Ctx from './context.ts';
import type { ISilentError } from './types.ts';

/**
 * Runs a CLI application with comprehensive lifecycle management.
 *
 * This overload accepts an async function as the application entry point. Use the
 * command-based overload (below) for the common case of passing a root command directly.
 *
 * Handles:
 * - SIGINT (Ctrl-C) signal for graceful shutdown
 * - Error logging with stack traces (shown at debug level, suppressed otherwise)
 * - {@link ISilentError} for user-friendly messages without stack traces
 * - `ctx.close()` for resource cleanup in all exit paths
 * - `Deno.exit()` with the appropriate exit code
 *
 * @param ctx - Application context for logging and resource management
 * @param appFn - Async function containing the application logic
 * @param options - Configuration options
 * @param [options.noExit] - If `true`, suppress `Deno.exit()`. Useful in tests.
 *
 * @example
 * ```typescript
 * await run(ctx, async () => {
 *   const cmd = new RootCommand(ctx);
 *   await cmd.init();
 *   await cmd.commander.parseAsync();
 * });
 * ```
 */
export async function run<TCtx extends Ctx.AbstractBase = Ctx.AbstractBase>(
  ctx: TCtx,
  appFn: () => Promise<unknown>,
  options?: { noExit?: boolean },
): Promise<void>;

/**
 * Enhanced run function with automatic logging configuration
 *
 * This overload automatically configures logging based on parsed command options.
 * The command's global action handler will call configureLogging() after parsing.
 *
 * @param ctx - Application context for logging and resource management
 * @param command - Command instance that will be parsed
 * @param options - Configuration options for the runner
 * @param options.noExit - If true, don't call Deno.exit() (useful for testing)
 *
 * @example
 * ```typescript
 * const cmd = new RootCommand();
 * await cmd.init(ctx);
 * await run(ctx, cmd); // Automatic logging configuration
 * ```
 */
export async function run<TCtx extends Ctx.AbstractBase = Ctx.AbstractBase>(
  ctx: TCtx,
  command: Cmd.AbstractBase<TCtx, TCtx>,
  options?: { noExit?: boolean },
): Promise<void>;

export async function run<TCtx extends Ctx.AbstractBase = Ctx.AbstractBase>(
  ctx: TCtx,
  appFnOrCommand: (() => Promise<unknown>) | Cmd.AbstractBase<TCtx, TCtx>,
  options: { noExit?: boolean } = {},
): Promise<void> {
  const t0 = performance.now();
  let exitCode = 0;
  let isClosing = false;
  let interrupted = false;

  const sigintHandler = async () => {
    if (isClosing) return;
    isClosing = true;
    interrupted = true;

    try {
      await ctx.close();
      ctx.log.info.h1('Application').label('Interrupted').ewt(performance.now() - t0);
    } catch (err) {
      ctx.log.error.label('Error during interrupt cleanup').err(_.asError(err));
    }
    Deno.exit(0);
  };
  Deno.addSignalListener('SIGINT', sigintHandler);

  try {
    // Handle both function and Command overloads
    if (typeof appFnOrCommand === 'function') {
      // Original function-based approach
      await appFnOrCommand();
    } else {
      // BaseCommand - initialize and then use its commander property to parse
      await appFnOrCommand.init();
      await appFnOrCommand.commander.parseAsync();
    }
  } catch (error) {
    exitCode = 1;
    const t1 = performance.now() - t0;
    const err = _.asError(error);
    const isSilent = (err as ISilentError).silent === true;

    if (isSilent) {
      ctx.log.nodent().info.h1('Application').error(err.message).ewt(t1);
    } else {
      ctx.log.error.h1('Application').err(err).ewt(t1);
      if (ctx.log.meetsThreshold('debug')) {
        console.log(err.stack);
      } else {
        ctx.log.error.error('Error:').text(err.message).ewt(t1);
        ctx.log.info.text('Rerun with --log debug to view stack trace');
      }
    }
  } finally {
    if (!isClosing) {
      isClosing = true;
      try {
        await ctx.close();
        if (exitCode === 0) {
          ctx.log.info.h1('Application').label('done').ewt(performance.now() - t0);
          ctx.log.nodent();
        }
      } catch (closeError) {
        ctx.log.error.label('Error during cleanup').err(_.asError(closeError));
        exitCode = 1;
      }
    }

    Deno.removeSignalListener('SIGINT', sigintHandler);
    if (!interrupted && !options.noExit) {
      Deno.exit(exitCode);
    }
  }
}
