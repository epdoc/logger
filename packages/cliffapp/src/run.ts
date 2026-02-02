import type { ActionHandler, Command } from '@cliffy/command';
import { configureLogging } from './logging.ts';
import type { GlobalLogOptions, ICtx, ISilentError, Logger, MsgBuilder } from './types.ts';

/**
 * A standardized run wrapper for Cliffy applications.
 * Handles initialization, global logging setup based on parsed options,
 * error handling (with support for SilentError), signal management, and graceful shutdown.
 *
 * This function provides complete application lifecycle management including:
 * - SIGINT (Ctrl-C) signal handling for graceful shutdown
 * - Error handling with appropriate logging and exit codes
 * - Resource cleanup via ctx.close()
 * - Performance timing and reporting
 * - Stack trace management based on log level
 *
 * @example
 * ```ts
 * import { Command } from "@cliffy/command";
 * import { run, ICtx } from "@epdoc/cliffapp";
 *
 * const ctx = {} as ICtx; // Your context
 * const command = new Command().action(() => {
 *   ctx.log.info.text("Hello World").emit();
 * });
 *
 * if (import.meta.main) {
 *   await run(ctx, command);
 * }
 * ```
 *
 * @param ctx - The application context.
 * @param command - The root Cliffy Command instance.
 * @param args - Command line arguments (defaults to Deno.args).
 * @param options - Optional configuration object.
 */
export async function run<M extends MsgBuilder, L extends Logger<M>>(
  ctx: ICtx<M, L>,
  command: Command,
  args: string[] = Deno.args,
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
      ctx.log.info.h1('Application').label('Interrupted').ewt(
        performance.now() - t0,
      );
    } catch (err) {
      ctx.log.error.label('Error during interrupt cleanup').err(
        err instanceof Error ? err : new Error(String(err)),
      );
    }
    Deno.exit(0);
  };
  Deno.addSignalListener('SIGINT', sigintHandler);

  try {
    // We use a global action to configure logging once the options are parsed.
    // In Cliffy, global actions run before subcommand actions.
    command.globalAction(
      ((opts: GlobalLogOptions) => {
        configureLogging(ctx, opts);
      }) as ActionHandler,
    );

    await command.parse(args);
  } catch (error) {
    exitCode = 1;
    const t1 = performance.now() - t0;
    const err = error instanceof Error ? error : new Error(String(error));
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
          ctx.log.info.h1('Application').label('done').ewt(
            performance.now() - t0,
          );
          ctx.log.nodent();
        }
      } catch (closeError) {
        ctx.log.error.label('Error during cleanup').err(
          closeError instanceof Error ? closeError : new Error(String(closeError)),
        );
        exitCode = 1;
      }
    }

    Deno.removeSignalListener('SIGINT', sigintHandler);
    if (!interrupted && !options.noExit) {
      Deno.exit(exitCode);
    }
  }
}
