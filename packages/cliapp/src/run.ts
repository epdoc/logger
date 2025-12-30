/**
 * @file Application lifecycle management
 * @description Provides standardized application execution with error handling,
 * signal management, and resource cleanup for CLI applications.
 * @module
 */

import * as _ from '@epdoc/type';
import type { ICtx, Logger, MsgBuilder } from './types.ts';

/**
 * Runs a CLI application with standardized lifecycle management
 *
 * Provides a complete application wrapper that handles:
 * - SIGINT (Ctrl-C) signal handling for graceful shutdown
 * - Error handling with appropriate logging and exit codes
 * - Resource cleanup via ctx.close()
 * - Performance timing and reporting
 * - Stack trace management based on log level
 *
 * This function never returns - it always calls Deno.exit() with appropriate exit codes.
 *
 * @param ctx - Application context for logging and resource management
 * @param appFn - Main application function to execute
 *
 * @example
 * ```typescript
 * // Traditional API usage
 * await run(ctx, async () => {
 *   const cmd = new Command(pkg);
 *   cmd.init(ctx);
 *   cmd.addLogging(ctx);
 *
 *   const opts = await cmd.parseOpts();
 *   configureLogging(ctx, opts);
 *
 *   // Your application logic here
 *   await processFiles(opts.files);
 * });
 *
 * // The run function handles:
 * // - Ctrl-C interruption (exit code 0)
 * // - Application errors (exit code 1)
 * // - Resource cleanup (ctx.close())
 * // - Performance timing
 * ```
 */
export async function run<M extends MsgBuilder = MsgBuilder, L extends Logger<M> = Logger<M>>(
  ctx: ICtx<M, L>,
  appFn: () => Promise<unknown>,
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
    await appFn();
  } catch (error) {
    exitCode = 1;
    const t1 = performance.now() - t0;
    const err = _.asError(error);

    if ('silent' in err) {
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
    if (!interrupted) {
      Deno.exit(exitCode);
    }
  }
}
