import * as colors from '@std/fmt/colors';
import type * as MsgBuilder from '../../message/index.ts';
import { LogLevels } from '../base.ts';
import type * as Level from '../types.ts';

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
export const createLogLevels: Level.FactoryMethod = () => {
  return new LogLevels(logLevelDefs);
};

/**
 * Defines the interface for a standard logger, exposing message builders for
 * each standard log level.
 *
 * @template M - The type of message builder used by the logger.
 */
export interface ILogger<M extends MsgBuilder.IBasic> {
  /** Message builder for the `ERROR` log level. */
  error: M;
  /** Message builder for the `WARN` log level. */
  warn: M;
  /** Message builder for the `INFO` log level. */
  info: M;
  /** Message builder for the `VERBOSE` log level. */
  verbose: M;
  /** Message builder for the `DEBUG` log level. */
  debug: M;
  /** Message builder for the `TRACE` log level. */
  trace: M;
  /** Message builder for the `SPAM` log level. */
  spam: M;
}

/**
 * An array containing the names of all standard log levels.
 */
export const LogLevelNames: string[] = Object.keys(logLevelDefs);
