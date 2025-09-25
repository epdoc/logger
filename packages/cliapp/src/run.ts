import * as _ from '@epdoc/type';
import type { ICtx, Logger, MsgBuilder } from './types.ts';

/**
 * Runs the main application function with a standardized execution wrapper. This function sets up a
 * `SIGINT` (Ctrl-C) listener for graceful shutdown, invokes the application function, and handles
 * any errors that occur, logging them consistently. It ensures that the `ctx.close()` method is
 * called to clean up resources before exiting.
 *
 * @param {Ctx.ICtx} ctx - The application context.
 * @param {() => Promise<unknown>} appFn - The main application function to execute.
 * @returns {Promise<void>} A promise that never resolves, as the process will exit.
 */
export async function run<M extends MsgBuilder = MsgBuilder, L extends Logger<M> = Logger<M>>(
  ctx: ICtx<M, L>,
  appFn: () => Promise<unknown>,
): Promise<void> {
  const t0 = performance.now();

  const sigintHandler = () => {
    ctx.close().then(() => {
      ctx.log.info
        .h1('Application')
        .label('Interrupted')
        .ewt(performance.now() - t0);
      Deno.exit(0);
    });
  };
  Deno.addSignalListener('SIGINT', sigintHandler);

  let exitCode = 0;
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
  }

  try {
    await ctx.close();
  } catch (closeError) {
    if (exitCode === 0) {
      exitCode = 1;
    }
    ctx.log.error.label('Error during cleanup').err(_.asError(closeError));
  }

  if (exitCode === 0) {
    ctx.log.info.h1('Application').label('done').ewt(performance.now() - t0);
    ctx.log.nodent();
  }

  Deno.removeSignalListener('SIGINT', sigintHandler);
  Deno.exit(exitCode);
}
