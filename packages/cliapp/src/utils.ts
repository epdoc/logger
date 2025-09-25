/**
 * @file Provides utility functions for the CLI application.
 * @description This module includes functions for configuring logging based on command-line
 * options, running the application with standardized error handling and signal management, and
 * parsing comma-separated string values.
 * @module
 */

import * as Log from '@epdoc/logger';
import * as _ from '@epdoc/type';
import type { ICtx, ISilentError, Logger, MsgBuilder, Opts } from './types.ts';

const REG = {
  levelType: new RegExp(/^level(:(icon|\d{1,2}|\-\d{1,2}))?$/),
};

/**
 * Configures logging settings based on parsed command-line options. This function adjusts the log
 * level threshold and output format (e.g., showing timestamps or package names) based on flags like
 * `--log`, `--verbose`, `--debug`, and `--log_show`.
 *
 * @param {Ctx.ICtx} ctx - The application context, containing the logger manager.
 * @param {Opts} opts - The parsed command-line options.
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

  const show: Log.EmitterShowOpts = {
    level: true,
    timestamp: Log.TimestampFormat.ELAPSED,
    pkg: true,
    reqId: true,
    elapsed: true,
  };
  if (opts.showall) {
    show.timestamp = Log.TimestampFormat.ELAPSED;
    show.pkg = true;
    show.level = true;
    show.reqId = true;
    show.elapsed = true;
    ctx.logMgr.show = show;
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
        } else if (prefix === 'elapsed') {
          show.elapsed = true;
        } else if (prefix === 'all') {
          show.timestamp = Log.TimestampFormat.ELAPSED;
          show.pkg = true;
          show.level = true;
          show.reqId = true;
        }
      }
    }
  }
  ctx.logMgr.show = show;
}

/**
 * Splits a comma-separated string into an array of strings.
 * This is a simple utility function for parsing list-based command-line arguments.
 *
 * @param {string} val - The comma-separated string.
 * @returns {string[]} An array of strings.
 */
export function commaList(val: string): string[] {
  return val.split(',');
}

export class SilentError extends Error {
  silent = true;
  constructor(message: string) {
    super(message);
  }
}
