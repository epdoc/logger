import * as Log from '@epdoc/logger';
import * as _ from '@epdoc/type';
import type { ICtx, LogOptions } from './types.ts';

const REG = {
  levelType: new RegExp(/^level(:(icon|\d{1,2}|\-\d{1,2}))?$/),
};

/**
 * Configures logging settings based on command-line options
 *
 * Processes standard logging options (--log, --verbose, --debug, etc.) and applies
 * them to the logger manager. Handles log level conflicts and configures output
 * formatting based on --log_show options.
 *
 * @param ctx - Application context containing the logger manager
 * @param opts - Parsed command-line options from Commander.js
 *
 * @throws {ISilentError} When conflicting log level options are provided
 *
 * @example
 * ```typescript
 * const opts = await cmd.parseOpts();
 * configureLogging(ctx, opts);
 *
 * // Now logger respects CLI options:
 * // --verbose sets threshold to 'verbose'
 * // --log_show level,elapsed shows level and timing
 * // --showall shows all available log components
 * ```
 */
/**
 * Configures logging based on parsed CLI options
 *
 * @param ctx - Application context with logger
 * @param opts - Parsed command-line options
 */
export function configureLogging(ctx: ICtx, opts: LogOptions): void {
  if (opts.dryRun) {
    ctx.dryRun = true;
  }

  // confirm that only one of opts.log, opts.verbose, opts.debug, opts.trace or opts.spam are set
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

  const show: Log.EmitterShowOpts = {};

  if (_.isBoolean(opts.noColor)) {
    show.color = !opts.noColor;
  }

  if (opts.logShowAll) {
    setAllShow(show);
  } else if (opts.logShow) {
    if (_.isNonEmptyArray(opts.logShow)) {
      for (const prefix of opts.logShow) {
        const prefixStr = String(prefix);
        const m = prefixStr.match(REG.levelType);
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
  show.color = true;
}

/**
 * Parses comma-separated string values into an array
 *
 * Simple utility function for parsing list-based command-line arguments.
 * Used internally by Commander.js option parsers for array-type options.
 *
 * @param val - Comma-separated string value
 * @returns Array of trimmed string values
 *
 * @example
 * ```typescript
 * commaList('a,b,c') // ['a', 'b', 'c']
 * commaList('level,elapsed,package') // ['level', 'elapsed', 'package']
 * ```
 */
export function commaList(val: string): string[] {
  return val.split(',');
}

/**
 * Error class for silent failures that should not display stack traces
 *
 * Used for expected errors like validation failures or user input errors
 * where showing a stack trace would be confusing rather than helpful.
 *
 * @example
 * ```typescript
 * if (!isValidInput(userInput)) {
 *   throw new SilentError('Invalid input format');
 * }
 * ```
 */
export class SilentError extends Error {
  silent = true;
  constructor(message: string) {
    super(message);
  }
}
