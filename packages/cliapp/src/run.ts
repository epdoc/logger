/**
 * @file Application lifecycle management
 * @description Provides standardized application execution with error handling,
 * signal management, and resource cleanup for CLI applications.
 * @module
 */

import * as _ from '@epdoc/type';
import type { Console } from '@epdoc/msgbuilder';
import type { BaseCommand } from './cmd-abstract.ts';
import type { ICtx, ISilentError } from './types.ts';

/**
 * Runs a CLI application with comprehensive lifecycle management
 *
 * Provides production-ready application wrapper that handles:
 * - SIGINT (Ctrl-C) signal handling for graceful shutdown
 * - Error handling with appropriate logging and exit codes
 * - Resource cleanup via ctx.close()
 * - Performance timing and reporting
 * - Stack trace management based on log level
 * - Silent error handling for user-friendly messages
 *
 * @param ctx - Application context for logging and resource management
 * @param appFn - Main application function to execute
 * @param options - Configuration options for the runner
 * @param options.noExit - If true, don't call Deno.exit() (useful for testing)
 *
 * @example
 * ```typescript
 * await run(ctx, async () => {
 *   const cmd = new Command(pkg);
 *   await cmd.init(ctx);
 *   await cmd.parseAsync();
 * });
 * ```
 */
export async function run<TCtx extends ICtx<any, any> = ICtx>(
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
export async function run<TCtx extends ICtx<any, any> = ICtx>(
  ctx: TCtx,
  command: BaseCommand<TCtx, TCtx>,
  options?: { noExit?: boolean },
): Promise<void>;

export async function run<TCtx extends ICtx<any, any> = ICtx>(
  ctx: TCtx,
  appFnOrCommand: (() => Promise<unknown>) | BaseCommand<TCtx, TCtx>,
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
    if (_.isFunction(appFnOrCommand)) {
      // Original function-based approach
      await appFnOrCommand();
    } else {
      // BaseCommand - use its commander property to parse
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
