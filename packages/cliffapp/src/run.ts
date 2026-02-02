import type * as Cliffy from '@cliffy/command';
import { configureLogging } from './logging.ts';
import type * as Base from './types.ts';

/**
 * Standardized application runner with complete lifecycle management.
 *
 * This function wraps your Cliffy command with comprehensive application lifecycle
 * management, providing production-ready error handling, logging integration,
 * signal management, and graceful shutdown capabilities.
 *
 * ## Features:
 *
 * **Automatic Logging Configuration:**
 * - Configures @epdoc/logger based on parsed CLI options (--verbose, --debug, etc.)
 * - Integrates seamlessly with addLoggingOptions()
 *
 * **Signal Handling:**
 * - Graceful SIGINT (Ctrl-C) handling with cleanup
 * - Prevents data corruption during shutdown
 *
 * **Error Management:**
 * - Distinguishes between SilentError (user-friendly) and system errors
 * - Conditional stack trace display based on log level
 * - Appropriate exit codes for different error types
 *
 * **Performance Monitoring:**
 * - Execution timing with millisecond precision
 * - Performance reporting in log output
 *
 * **Resource Cleanup:**
 * - Automatic ctx.close() invocation
 * - Cleanup on both success and error paths
 *
 * ## Usage Patterns:
 *
 * @example Simple usage:
 * ```typescript
 * import { Command, run } from "@epdoc/cliffapp";
 *
 * const ctx = new MyContext();
 * const cmd = new Command();
 * cmd.action(() => ctx.log.info.text("Hello!").emit());
 *
 * if (import.meta.main) {
 *   await run(ctx, cmd.cmd);
 * }
 * ```
 *
 * @example With custom arguments (testing):
 * ```typescript
 * await run(ctx, command, ["--verbose", "subcommand", "--option", "value"]);
 * ```
 *
 * @example With no-exit option (testing):
 * ```typescript
 * await run(ctx, command, Deno.args, { noExit: true });
 * ```
 *
 * @param ctx - Application context with logger and cleanup capabilities
 * @param command - Root Cliffy Command instance to execute
 * @param args - Command line arguments (defaults to Deno.args)
 * @param options - Configuration options for the runner
 * @param options.noExit - If true, don't call Deno.exit() (useful for testing)
 */
export async function run<M extends Base.MsgBuilder, L extends Base.Logger<M>>(
  ctx: Base.ICtx<M, L>,
  command: Cliffy.Command,
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
      ((opts: Base.GlobalOptions) => {
        configureLogging(ctx, opts);
      }) as Cliffy.ActionHandler,
    );

    await command.parse(args);
  } catch (error) {
    exitCode = 1;
    const t1 = performance.now() - t0;
    const err = error instanceof Error ? error : new Error(String(error));
    const isSilent = (err as Base.ISilentError).silent === true;

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
