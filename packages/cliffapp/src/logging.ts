import * as Log from '@epdoc/logger';
import { _ } from '@epdoc/type';
import type { GlobalLogOptions, ICtx, Logger, MsgBuilder } from './types.ts';

const REG = {
  levelType: new RegExp(/^level(:(icon|\d{1,2}|\-\d{1,2}))?$/),
};

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
export function configureLogging<M extends MsgBuilder = MsgBuilder, L extends Logger<M> = Logger<M>>(
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
    ctx.log.error.text('Conflicting command line options:').label(logOptions).emit();
    throw new Error('Conflicting command line options: ' + logOptions.join(', '));
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
