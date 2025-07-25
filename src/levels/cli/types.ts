import * as colors from '@std/fmt/colors';
import type { IBasic as MsgBuilderIBasic } from '../../message/types.ts';
import { LogLevels } from '../base.ts';
import type * as Level from '../types.ts';

/**
 * Defines the log levels and their properties specifically for CLI applications.
 *
 * @remarks
 * This object maps log level names (e.g., 'error', 'info') to their numeric
 * values, associated formatting functions (for console colors), and special
 * flags like `flush` (for immediate output), `default` (the default level),
 * and `lowest` (the lowest priority level).
 */
const cliLogLevelDefs: Level.LogLevelsDef = {
  error: { val: 0, fmtFn: colors.red, flush: true },
  warn: { val: 1, fmtFn: colors.yellow, warn: true },
  help: { val: 2, fmtFn: colors.cyan },
  data: { val: 3, fmtFn: colors.gray },
  info: { val: 4, fmtFn: colors.green, default: true },
  debug: { val: 5, fmtFn: colors.blue },
  prompt: { val: 6, fmtFn: colors.gray },
  verbose: { val: 7, fmtFn: colors.cyan },
  input: { val: 8, fmtFn: colors.gray },
  silly: { val: 9, fmtFn: colors.magenta, lowest: true },
} as const;

/**
 * Factory method to create an instance of {@link LogLevels} configured with
 * the CLI-specific log level definitions.
 *
 * @returns {Level.IBasic} A new `LogLevels` instance for CLI logging.
 */
export const createCliLogLevels: Level.FactoryMethod = () => {
  return new LogLevels(cliLogLevelDefs);
};

/**
 * Defines the interface for a CLI logger, exposing message builders for each
 * CLI-specific log level.
 *
 * @template M - The type of message builder used by the logger.
 */
export interface ICliLogger<M extends MsgBuilderIBasic> {
  /** Message builder for the `ERROR` log level. */
  error: M;
  /** Message builder for the `WARN` log level. */
  warn: M;
  /** Message builder for the `HELP` log level. */
  help: M;
  /** Message builder for the `DATA` log level. */
  data: M;
  /** Message builder for the `INFO` log level. */
  info: M;
  /** Message builder for the `DEBUG` log level. */
  debug: M;
  /** Message builder for the `PROMPT` log level. */
  prompt: M;
  /** Message builder for the `VERBOSE` log level. */
  verbose: M;
  /** Message builder for the `INPUT` log level. */
  input: M;
  /** Message builder for the `SILLY` log level. */
  silly: M;
}

/**
 * An array containing the names of all CLI log levels.
 */
export const cliLogLevelNames: string[] = Object.keys(cliLogLevelDefs);
