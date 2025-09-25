import * as Level from '$level';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import * as colors from '@std/fmt/colors';
import { LogMgr } from '../../logmgr.ts';
import type * as Base from '../base/mod.ts';
import type { IFactoryMethods } from '../factory.ts';
import { MinLogger } from './logger.ts';

/**
 * Defines the standard log levels and their properties.
 *
 * @remarks
 * This object maps common log level names (e.g., 'error', 'info') to their
 * numeric values, associated formatting functions (for console colors), and
 * special flags like `flush` (for immediate output) and `lowest` (the lowest
 * priority level).
 */
const minLogLevelDefs: Level.LogLevelsDef = {
  error: { val: 1, fmtFn: colors.red, flush: true },
  warn: { val: 2, fmtFn: colors.yellow, warn: true },
  info: { val: 3, fmtFn: colors.green, default: true },
  debug: {
    val: 5,
    lowest: true,
    fmtFn: (str: string) => {
      return colors.dim(colors.blue(str));
    },
  },
} as const;

export const minFactoryMethods: IFactoryMethods<MsgBuilder.Abstract, MinLogger<MsgBuilder.Abstract>> = {
  createLogger: <M extends MsgBuilder.Abstract>(
    log: LogMgr<M> | Base.IEmitter,
    params?: Base.IGetChildParams,
  ): MinLogger<M> => {
    if (log instanceof LogMgr) {
      return new MinLogger<M>(log, params);
    } else if (log instanceof MinLogger) {
      return log.getChild(params) as MinLogger<M>;
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
    return new Level.LogLevels(minLogLevelDefs, 'min');
  },
  /**
   * An array containing the names of all CLI log levels.
   */
  logLevelNames: () => {
    return Object.keys(minLogLevelDefs);
  },
};
