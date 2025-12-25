/**
 * @file CLI application utility functions
 * @description Provides essential utilities for CLI applications including logging configuration,
 * application lifecycle management, and command-line argument parsing helpers.
 * @module
 */

import * as Log from '@epdoc/logger';
import * as _ from '@epdoc/type';
import type { ICtx, ISilentError, Logger, MsgBuilder, Opts } from './types.ts';

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
export function configureLogging<M extends MsgBuilder = MsgBuilder, L extends Logger<M> = Logger<M>>(
  ctx: ICtx<M, L>,
  opts: Opts,
): void {
  if (opts.dryRun) {
    ctx.dryRun = true;
  }

  // confirm that only one of opts.log, opts.verbose, opts.debug, opts.trace or opts.spam are set
  const logOptions: string[] = [];
  if (opts.log) logOptions.push(`--log ${opts.log}`);
  if (opts.verbose) logOptions.push('--verbose');
  if (opts.debug) logOptions.push('--debug');
  if (opts.trace) logOptions.push('--trace');
  if (opts.spam) logOptions.push('--spam');
  if (logOptions.length > 1) {
    ctx.log.error.error('Conflicting command line options:').label(logOptions)
      .emit();
    const err = new Error(
      'Conflicting command line options: ' + logOptions.join(', '),
    ) as ISilentError;
    err.silent = true;
    throw err;
  }

  if (opts.log) {
    ctx.logMgr.threshold = opts.log;
  } else if (opts.verbose) {
    ctx.logMgr.threshold = 'verbose';
  } else if (opts.debug) {
    ctx.logMgr.threshold = 'debug';
  } else if (opts.trace) {
    ctx.logMgr.threshold = 'trace';
  } else if (opts.spam) {
    ctx.logMgr.threshold = 'spam';
  }

  const show: Log.EmitterShowOpts = {};
  if (opts.showall) {
    show.timestamp = Log.TimestampFormat.ELAPSED;
    show.pkg = true;
    show.level = true;
    show.reqId = true;
    show.time = true;
    ctx.logMgr.show = show;
    return;
  }
  if (opts.log_show) {
    if (_.isNonEmptyArray(opts.log_show)) {
      for (const prefix of opts.log_show) {
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
          show.timestamp = Log.TimestampFormat.ELAPSED;
          show.pkg = true;
          show.level = true;
          show.reqId = true;
          show.time = true;
        }
      }
      ctx.logMgr.show = show;
      return;
    }
    ctx.logMgr.show = {
      level: true,
      timestamp: Log.TimestampFormat.ELAPSED,
      pkg: true,
      reqId: true,
      time: true,
    };
  }
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
