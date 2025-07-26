import * as colors from '@std/fmt/colors';
import * as Level from '../../levels/mod.ts';
import type * as MsgBuilder from '../../message/mod.ts';
import type * as Base from '../base/mod.ts';
import { LogMgr } from '../../logmgr.ts';
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
const logLevelDefs: Level.LogLevelsDef = {
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

/**
 * Factory method to create an instance of {@link LogLevels} configured with
 * the standard log level definitions.
 *
 * @returns {Level.IBasic} A new `LogLevels` instance for standard logging.
 */
export const createStdLogLevels: Level.FactoryMethod = () => {
  return new Level.LogLevels(logLevelDefs);
};

/**
 * An array containing the names of all standard log levels.
 */
export const stdLogLevelNames: string[] = Object.keys(logLevelDefs);

/**
 * Factory method to obtain a standard logger instance.
 *
 * @remarks
 * This function serves as the primary way to get a `StdLogger`. It can either
 * create a new root logger if a `LogMgr` is provided, or return a child logger
 * if an existing `StdLogger` instance is passed.
 *
 * @template M - The type of message builder used by the logger.
 * @param {LogMgr<M> | Logger.IEmitter} log - The log manager or an existing logger instance.
 * @param {Logger.IGetChildParams} [params] - Optional parameters for creating a child logger.
 * @returns {StdLogger<M>} A new or child `StdLogger` instance.
 * @throws {Error} If an invalid logger type is provided.
 */
export const createStdLogger = <M extends MsgBuilder.Base.IBuilder>(
  log: LogMgr<M> | Base.IEmitter,
  params?: Base.IGetChildParams,
): StdLogger<M> => {
  if (log instanceof LogMgr) {
    return new StdLogger<M>(log, params);
  } else if (log instanceof StdLogger) {
    return log.getChild(params) as StdLogger<M>;
  }
  throw new Error('Invalid logger type');
};
