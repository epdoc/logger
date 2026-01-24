/**
 * @file Helpers for Cliffy Command integration
 */

import { Command } from '@cliffy/command';
import type { GlobalLogOptions, ICtx, Logger, MsgBuilder } from './types.ts';
import { configureLogging } from './logging.ts';

/**
 * Adds standard logging options to a Cliffy command.
 * These are added as global options so they are available to all subcommands.
 */
export function addLoggingOptions<
  M extends MsgBuilder,
  L extends Logger<M>,
>(command: Command, ctx: ICtx<M, L>): any {
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
 * Handles initialization, global logging setup, error handling, and shutdown.
 */
export async function run<M extends MsgBuilder, L extends Logger<M>>(
  ctx: ICtx<M, L>,
  command: Command,
  args: string[] = Deno.args,
) {
  try {
    // We use a global action to configure logging once the options are parsed.
    // In Cliffy, global actions run before subcommand actions.
    command.globalAction((opts: any) => {
      configureLogging(ctx, opts as GlobalLogOptions);
    });

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
