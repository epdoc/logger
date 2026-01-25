import type { ActionHandler, Command } from '@cliffy/command';
import { configureLogging } from './logging.ts';
import type { GlobalLogOptions, ICtx, ISilentError, Logger, MsgBuilder } from './types.ts';

/**
 * Adds standard @epdoc/logger logging options to a Cliffy command.
 * These are added as global options so they are available to all subcommands.
 *
 * Specific options added:
 * - `--log <level>`: Set the threshold log output level (e.g., debug, info, warn, error).
 * - `--log-show <components>`: Comma-separated list of log components to show (e.g., level, time, pkg, all).
 * - `--no-color`: Disable color in output.
 * - `-A, --showall`: Shortcut for `--log-show all`.
 * - `-v, --verbose`: Shortcut for `--log verbose`.
 * - `-D, --debug`: Shortcut for `--log debug`.
 * - `-T, --trace`: Shortcut for `--log trace`.
 * - `-S, --spam`: Shortcut for `--log spam`.
 * - `-n, --dry-run`: Set dry-run mode (available via `ctx.dryRun`).
 *
 * @param command - The Cliffy Command instance to add options to.
 * @param _ctx - The application context (used for type inference).
 * @returns The modified Command instance.
 */
export function addLoggingOptions<
  M extends MsgBuilder,
  L extends Logger<M>,
>(
  // deno-lint-ignore no-explicit-any
  command: Command<void, void, void, any[], any, any, any, any>,
  _ctx: ICtx<M, L>,
  // deno-lint-ignore no-explicit-any
): Command<void, void, void, any[], any, any, any, any> {
  return command
    .globalOption('--log <level:string>', 'Set the threshold log output level.', {
      collect: false,
    })
    .globalOption('--log-show <show:string[]>', 'Enable log message output components.', {
      separator: ',',
    })
    .globalOption('--no-color', 'Do not show color in output')
    .globalOption('-A, --showall', 'Shortcut for --log-show all')
    .globalOption('-v, --verbose', 'Shortcut for --log verbose')
    .globalOption('-D, --debug', 'Shortcut for --log debug')
    .globalOption('-T, --trace', 'Shortcut for --log trace')
    .globalOption('-S, --spam', 'Shortcut for --log spam')
    .globalOption('-n, --dry-run', 'Do not modify any existing data or files', {
      default: false,
    });
}

/**
 * Error class for failures that should not display stack traces.
 */
export class SilentError extends Error implements ISilentError {
  silent = true;
  constructor(message: string) {
    super(message);
  }
}

/**
 * A standardized run wrapper for Cliffy applications.
 * Handles initialization, global logging setup based on parsed options,
 * error handling (with support for SilentError), and graceful shutdown.
 *
 * @param ctx - The application context.
 * @param command - The root Cliffy Command instance.
 * @param args - Command line arguments (defaults to Deno.args).
 */
export async function run<M extends MsgBuilder, L extends Logger<M>>(
  ctx: ICtx<M, L>,
  command: Command,
  args: string[] = Deno.args,
) {
  try {
    // We use a global action to configure logging once the options are parsed.
    // In Cliffy, global actions run before subcommand actions.
    command.globalAction(
      ((opts: GlobalLogOptions) => {
        configureLogging(ctx, opts);
        // deno-lint-ignore no-explicit-any
      }) as ActionHandler<void, any[], any, any, any, any, any, any>,
    );

    await command.parse(args);
  } catch (err) {
    const isSilent = (err as ISilentError).silent === true;
    if (ctx.log) {
      if (isSilent) {
        ctx.log.error.text(err instanceof Error ? err.message : String(err)).emit();
      } else {
        ctx.log.error.text(err instanceof Error ? err.stack || err.message : String(err)).emit();
      }
    } else {
      console.error(err);
    }
    Deno.exit(1);
  } finally {
    await ctx.close();
  }
}
