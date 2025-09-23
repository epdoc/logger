import * as Level from '$level';
import type * as MsgBuilder from '$msgbuilder';
import * as colors from '@std/fmt/colors';
import { LogMgr } from '../../logmgr.ts';
import type * as Base from '../base/mod.ts';
import type { IFactoryMethods } from '../factory.ts';
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
  error: { val: 0, fmtFn: colors.red, flush: true, icon: '❌' },
  warn: { val: 1, fmtFn: colors.yellow, warn: true, icon: '⚠️' },
  help: { val: 2, fmtFn: colors.cyan, icon: '💡' },
  data: { val: 3, fmtFn: colors.gray, icon: '📊' },
  info: { val: 4, fmtFn: colors.green, default: true, icon: 'ℹ️' },
  debug: { val: 5, fmtFn: colors.blue, icon: '🔍' },
  prompt: { val: 6, fmtFn: colors.gray, icon: '➡️' },
  verbose: { val: 7, fmtFn: colors.cyan, icon: '📝' },
  input: { val: 8, fmtFn: colors.gray, icon: '⌨️' },
  silly: { val: 9, fmtFn: colors.magenta, lowest: true, icon: '🤪' },
} as const;

export const cliFactoryMethods: IFactoryMethods<MsgBuilder.Abstract, CliLogger<MsgBuilder.Abstract>> = {
  createLogger: <M extends MsgBuilder.Abstract>(
    log: LogMgr<M> | Base.IEmitter,
    params?: Base.IGetChildParams,
  ): CliLogger<M> => {
    if (log instanceof LogMgr) {
      return new CliLogger<M>(log, params);
    } else if (log instanceof CliLogger) {
      return log.getChild(params) as CliLogger<M>;
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
    return new Level.LogLevels(cliLogLevelDefs);
  },
  /**
   * An array containing the names of all CLI log levels.
   */
  logLevelNames: () => {
    return Object.keys(cliLogLevelDefs);
  },
};
