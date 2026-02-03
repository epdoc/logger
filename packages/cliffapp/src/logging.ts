import * as Cliffy from '@cliffy/command';
import * as Log from '@epdoc/logger';
import { _ } from '@epdoc/type';
import * as colors from '@std/fmt/colors';
import type { GlobalOptions, ICtx, Logger, MsgBuilder } from './types.ts';

const REG = {
  levelType: new RegExp(/^level(:(icon|\d{1,2}|\-\d{1,2}))?$/),
  logShow: new RegExp(/^(level(:(icon|\d+))?|package|reqId|utc|locale|elapsed|time|all)$/),
};

const logShowValues = [
  'level',
  'level:icon',
  'level:int',
  'package',
  'reqId',
  'utc',
  'locale',
  'elapsed',
  'time',
  'all',
];

/**
 * Adds standardized logging options to a Cliffy command.
 *
 * This function adds a comprehensive set of logging-related options that integrate
 * seamlessly with @epdoc/logger. The options are added as global options, making
 * them available to all subcommands in the hierarchy.
 *
 * ## Added Options:
 *
 * **Log Level Control:**
 * - `--log-level <level>`: Set threshold log level with validation (FATAL, ERROR, WARN, INFO, VERBOSE, DEBUG, TRACE, SPAM)
 * - `-v, --verbose`: Shortcut for `--log-level VERBOSE`
 * - `-D, --debug`: Shortcut for `--log-level DEBUG`
 * - `-T, --trace`: Shortcut for `--log-level TRACE`
 * - `-S, --spam`: Shortcut for `--log-level SPAM`
 *
 * **Log Display Control:**
 * - `--log-show <components>`: Comma-separated list of components to display (level, time, package, etc.)
 * - `-A, --log-show-all`: Shortcut for `--log-show all`
 * - `--no-color`: Disable colored output
 *
 * **Execution Control:**
 * - `-n, --dry-run`: Enable dry-run mode (sets `ctx.dryRun = true`)
 *
 * ## Usage Patterns:
 *
 * @example Basic usage:
 * ```typescript
 * import { Command } from "@cliffy/command";
 * import { addLoggingOptions } from "@epdoc/cliffapp";
 *
 * const cmd = new Command();
 * addLoggingOptions(cmd, ctx);
 * ```
 *
 * @example In a class-based command:
 * ```typescript
 * class MyCommand extends Command<MyContext> {
 *   protected override setupOptions(): void {
 *     this.cmd.description("My command");
 *     addLoggingOptions(this.cmd, this.ctx);
 *   }
 * }
 * ```
 *
 * @example In a declarative command:
 * ```typescript
 * const tree = {
 *   description: "My CLI",
 *   setupGlobalAction: (cmd, ctx) => addLoggingOptions(cmd, ctx),
 *   // ... rest of command definition
 * };
 * ```
 *
 * @param command - The Cliffy Command instance to enhance with logging options
 * @param ctx - The application context (used for type inference).
 * @returns The modified Command instance.
 */
export function addLoggingOptions<C extends Cliffy.Command, M extends MsgBuilder, L extends Logger<M>>(
  command: C,
  ctx: ICtx<M, L>,
): C {
  // Register enum type for log levels (equivalent to commander's .choices())
  command.globalType('logLevel', new Cliffy.EnumType(ctx.logMgr.logLevels.names));
  command.globalType('logShow', new Cliffy.EnumType(logShowValues));

  return command
    .globalOption(
      '--log-level <level:logLevel>',
      'Set the threshold log output level.',
      {
        collect: false,
      },
    )
    .globalOption('-v, --verbose', 'Shortcut for --log-level verbose')
    .globalOption('-D, --debug', 'Shortcut for --log-level debug')
    .globalOption('-T, --trace', 'Shortcut for --log-level trace')
    .globalOption('-S, --spam', 'Shortcut for --log-level spam')
    .globalOption(
      '--log-show <show:string[]>',
      'Control which log properties are displayed. ' +
        'Can comma separate ' +
        colors.blue('level|level:icon|level:int|package|reqId|utc|locale|elapsed|time|all') +
        '. E.g. ' +
        colors.green('--log-show level,elapsed,package') +
        ', or ' +
        colors.green('--log-show all') +
        ' or the equivalent ' +
        colors.green('-A'),
      {
        separator: ',',
        value: (val: string[], previous: string[] = []) => {
          for (const choice of val) {
            if (!REG.logShow.test(choice)) {
              throw new Error(
                `Invalid log-show value: ${choice}. Valid values: level, level:icon, level:INT, package, reqId, utc, locale, elapsed, time, all`,
              );
            }
          }
          return [...previous, ...val];
        },
      },
    )
    .globalOption('-A, --log-show-all', 'Shortcut for --log-show all')
    .globalOption('--no-color', 'Do not show color in output')
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
  opts: Partial<GlobalOptions>,
): void {
  if (opts.dryRun) {
    ctx.dryRun = true;
  }
  // Determine threshold
  let threshold: string | undefined;
  const logOptions: string[] = [];

  if (opts.logLevel) {
    threshold = opts.logLevel;
    logOptions.push(`--log-level ${opts.logLevel}`);
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

  if (_.isBoolean(opts.noColor)) {
    show.color = !opts.noColor;
  }

  if (opts.logShowAll) {
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
