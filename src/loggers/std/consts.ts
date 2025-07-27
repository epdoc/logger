import * as colors from '@std/fmt/colors';
import * as Level from '../../levels/mod.ts';
import { LogMgr } from '../../logmgr.ts';
import type * as MsgBuilder from '../../message/mod.ts';
import type * as Base from '../base/mod.ts';
import type { IFactoryMethods } from '../factory.ts';
import { StdLogger } from './logger.ts';

/**
 * Defines the standard log levels and their properties.
 *
 * @remarks
 * This object maps common log level names (e.g., 'error', 'info') to their
 * numeric values, associated formatting functions (for console colors), and
 * special flags like `flush` (for immediate output) and `lowest` (the lowest
 * priority level).
 */
const stdLogLevelDefs: Level.LogLevelsDef = {
  error: { val: 0, fmtFn: colors.red, flush: true },
  warn: { val: 1, fmtFn: colors.brightYellow, warn: true },
  info: { val: 2, fmtFn: colors.white },
  verbose: { val: 3, fmtFn: colors.blue },
  debug: {
    val: 4,
    fmtFn: (str: string) => {
      return colors.dim(colors.blue(str));
    },
  },
  trace: { val: 5, fmtFn: colors.gray },
  spam: {
    val: 6,
    fmtFn: (str: string) => {
      return colors.dim(colors.gray(str));
    },
    lowest: true,
  },
} as const;

export const stdFactoryMethods: IFactoryMethods<MsgBuilder.Base.IBuilder, StdLogger<MsgBuilder.Base.IBuilder>> = {
  createLogger: <M extends MsgBuilder.Base.IBuilder>(
    log: LogMgr<M> | Base.IEmitter,
    params?: Base.IGetChildParams,
  ): StdLogger<M> => {
    if (log instanceof LogMgr) {
      return new StdLogger<M>(log, params);
    } else if (log instanceof StdLogger) {
      return log.getChild(params) as StdLogger<M>;
    }
    throw new Error('Invalid logger type');
  },
  /**
   * Factory method to create an instance of {@link LogLevels} configured with
   * the CLI-specific log level definitions.
   *
   * @returns {Level.IBasic} A new `LogLevels` instance for CLI logging.
   */
  createLevels: () => {
    return new Level.LogLevels(stdLogLevelDefs);
  },
  /**
   * An array containing the names of all CLI log levels.
   */
  logLevelNames: () => {
    return Object.keys(stdLogLevelDefs);
  },
};
