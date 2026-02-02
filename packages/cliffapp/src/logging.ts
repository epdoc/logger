import type { Command } from '@cliffy/command';
import * as Log from '@epdoc/logger';
import { _ } from '@epdoc/type';
import type { GlobalLogOptions, ICtx, Logger, MsgBuilder } from './types.ts';

const REG = {
  levelType: new RegExp(/^level(:(icon|\d{1,2}|\-\d{1,2}))?$/),
};

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
 * @example
 * ```ts
 * import { Command } from "@cliffy/command";
 * import { addLoggingOptions, ICtx } from "@epdoc/cliffapp";
 *
 * const ctx = {} as ICtx; // Your context
 * const command = new Command();
 * addLoggingOptions(command, ctx);
 * ```
 *
 * @param command - The Cliffy Command instance to add options to.
 * @param _ctx - The application context (used for type inference).
 * @returns The modified Command instance.
 */
export function addLoggingOptions<C extends Command, M extends MsgBuilder, L extends Logger<M>>(
  command: C,
  _ctx: ICtx<M, L>,
): C {
  return command
    .globalOption(
      '--log <level:string>',
      'Set the threshold log output level.',
      {
        collect: false,
      },
    )
    .globalOption(
      '--log-show <show:string[]>',
      'Enable log message output components.',
      {
        separator: ',',
      },
    )
    .globalOption('--no-color', 'Do not show color in output')
    .globalOption('-A, --showall', 'Shortcut for --log-show all')
    .globalOption('-v, --verbose', 'Shortcut for --log verbose')
    .globalOption('-D, --debug', 'Shortcut for --log debug')
    .globalOption('-T, --trace', 'Shortcut for --log trace')
    .globalOption('-S, --spam', 'Shortcut for --log spam')
    .globalOption('-n, --dry-run', 'Do not modify any existing data or files', {
      default: false,
    }) as unknown as C;
}

/**
 * Configures the @epdoc/logger system based on parsed CLI options.
 * This normally maps options like `--log`, `--verbose`, etc., to the logger manager.
 *
 * This function is designed to be called automatically by the `run` wrapper
 * inside a Cliffy pre-action hook.
 *
 * @example
 * ```ts
 * import { configureLogging, ICtx, GlobalLogOptions } from "@epdoc/cliffapp";
 *
 * const ctx = {} as ICtx; // Your context
 * const opts: GlobalLogOptions = { verbose: true };
 * configureLogging(ctx, opts);
 * ```
 *
 * @param ctx - The application context.
 * @param opts - The parsed global log options.
 */
export function configureLogging<
  M extends MsgBuilder = MsgBuilder,
  L extends Logger<M> = Logger<M>,
>(
  ctx: ICtx<M, L>,
  opts: GlobalLogOptions,
): void {
  if (opts.dryRun) {
    ctx.dryRun = true;
  }
  // Determine threshold
  let threshold: string | undefined;
  const logOptions: string[] = [];

  if (opts.log) {
    threshold = opts.log;
    logOptions.push(`--log ${opts.log}`);
  }
  if (opts.verbose) {
    threshold = 'verbose';
    logOptions.push('--verbose');
  }
  if (opts.debug) {
    threshold = 'debug';
    logOptions.push('--debug');
  }
  if (opts.trace) {
    threshold = 'trace';
    logOptions.push('--trace');
  }
  if (opts.spam) {
    threshold = 'spam';
    logOptions.push('--spam');
  }

  if (logOptions.length > 1) {
    ctx.log.error.text('Conflicting command line options:').label(logOptions)
      .emit();
    throw new Error(
      'Conflicting command line options: ' + logOptions.join(', '),
    );
  }

  if (threshold) {
    ctx.logMgr.threshold = threshold;
  }

  // Determine show options
  const show: Log.EmitterShowOpts = {};

  if (_.isBoolean(opts.color)) {
    show.color = opts.color;
  }

  if (opts.showall) {
    setAllShow(show);
  } else if (opts.logShow) {
    if (_.isNonEmptyArray(opts.logShow)) {
      for (const prefix of opts.logShow) {
        const m = prefix.match(REG.levelType);
        if (m && m.length) {
          show.level = true;
          if (m.length > 1) {
            if (m[2] === 'icon') {
              show.level = 'icon';
            } else {
              const val = _.asInt(m[2]);
              if (val) {
                show.level = val;
              }
            }
          }
        } else if (Log.isTimestampFormat(prefix)) {
          show.timestamp = prefix;
        } else if (prefix === 'package' || prefix === 'pkg') {
          show.pkg = true;
        } else if (prefix === 'reqId') {
          show.reqId = true;
        } else if (prefix === 'sid') {
          show.sid = true;
        } else if (prefix === 'time') {
          show.time = true;
        } else if (prefix === 'all') {
          setAllShow(show);
        }
      }
    } else {
      setAllShow(show);
    }
  }

  if (!_.isEmpty(show)) {
    ctx.logMgr.show = show;
  }
}

function setAllShow(show: Log.EmitterShowOpts) {
  show.timestamp = Log.TimestampFormat.ELAPSED;
  show.pkg = true;
  show.level = true;
  show.reqId = true;
  show.time = true;
}
