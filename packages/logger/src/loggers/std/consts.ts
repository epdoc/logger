import * as Level from '$level';
import type * as MsgBuilder from '$msgbuilder';
import * as colors from '@std/fmt/colors';
import { LogMgr } from '../../logmgr.ts';
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
  fatal: { val: 0, fmtFn: colors.red, flush: true, icon: '☠' },
  critical: { val: 0, fmtFn: colors.red, flush: true, icon: '⚡' },
  error: { val: 1, fmtFn: colors.red, flush: true, icon: '✗' },
  warn: { val: 2, fmtFn: colors.yellow, warn: true, icon: '⚠' },
  info: { val: 3, fmtFn: colors.green, default: true, icon: 'ℹ' },
  verbose: { val: 4, fmtFn: colors.cyan, icon: '…' },
  debug: {
    val: 5,
    fmtFn: (str: string) => {
      return colors.dim(colors.blue(str));
    },
    icon: '🔍',
  },
  trace: { val: 6, fmtFn: colors.gray, icon: '↳' },
  spam: {
    val: 7,
    fmtFn: (str: string) => {
      return colors.dim(colors.gray(str));
    },
    lowest: true,
    icon: '¶',
  },
  silly: {
    val: 7,
    fmtFn: (str: string) => {
      return colors.dim(colors.gray(str));
    },
    lowest: true,
    icon: '⁂',
  },
} as const;

export const stdFactoryMethods: IFactoryMethods<MsgBuilder.Abstract, StdLogger<MsgBuilder.Abstract>> = {
  createLogger: <M extends MsgBuilder.Abstract>(
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
    return new Level.LogLevels(stdLogLevelDefs, 'std');
  },
  /**
   * An array containing the names of all CLI log levels.
   */
  logLevelNames: () => {
    return Object.keys(stdLogLevelDefs);
  },
};
