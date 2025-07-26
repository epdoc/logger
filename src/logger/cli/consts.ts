import * as colors from '@std/fmt/colors';
import * as Level from '../../levels/mod.ts';
import { LogMgr } from '../../logmgr.ts';
import type * as MsgBuilder from '../../message/mod.ts';
import type * as Base from '../base/mod.ts';
import { CliLogger } from './logger.ts';

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
  return new Level.LogLevels(cliLogLevelDefs);
};

/**
 * An array containing the names of all CLI log levels.
 */
export const cliLogLevelNames: string[] = Object.keys(cliLogLevelDefs);

/**
 * Factory method to obtain a CLI logger instance.
 *
 * @remarks
 * This function provides a flexible way to get a `CliLogger`. It can either
 * create a new root logger if a `LogMgr` is provided, or return a child logger
 * if an existing `CliLogger` instance is passed.
 *
 * @example
 * const logMgr = new Log.Mgr(Log.cli.createLogLevels);
 * logMgr.loggerFactory = Log.cli.createLogger;
 * const logger = logMgr.getLogger<Log.cli.Logger<Log.MsgBuilder.Console>>();
 * logger.info.text('Hello').emit();
 *
 * @template M - The type of message builder used by the logger.
 * @param {LogMgr<M> | Logger.IEmitter} log - The log manager or an existing logger instance.
 * @param {Logger.IGetChildParams} [params] - Optional parameters for creating a child logger.
 * @returns {CliLogger<M>} A new or child `CliLogger` instance.
 * @throws {Error} If an invalid logger type is provided.
 */
export const createCliLogger = <M extends MsgBuilder.Base.IBuilder>(
  log: LogMgr<M> | Base.IEmitter,
  params?: Base.IGetChildParams,
): CliLogger<M> => {
  if (log instanceof LogMgr) {
    return new CliLogger<M>(log, params);
  } else if (log instanceof CliLogger) {
    return log.getChild(params) as CliLogger<M>;
  }
  throw new Error('Invalid logger type');
};
