import * as Level from '@epdoc/loglevels';
import type * as MsgBuilder from '@epdoc/msgbuilder';
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
const cliLogLevelsSet: Level.LogLevelsSet = {
  id: 'cli',
  levels: {
    error: { severity: 17, fmtFn: colors.red, icon: '✗' },
    warn: { severity: 13, fmtFn: colors.yellow, icon: '⚠' },
    help: { severity: 11, fmtFn: colors.cyan, icon: '?' },
    data: { severity: 10, fmtFn: colors.gray, icon: '≡' },
    info: { severity: 9, fmtFn: colors.green, icon: 'ℹ' },
    debug: { severity: 5, fmtFn: colors.blue, icon: '⚙' },
    prompt: { severity: 4, fmtFn: colors.gray, icon: '»' },
    verbose: { severity: 3, fmtFn: colors.cyan, icon: '…' },
    input: { severity: 2, fmtFn: colors.gray, icon: '⌨' },
    silly: { severity: 1, fmtFn: colors.magenta, icon: '☺' },
  },
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
   * @returns {Level.LogLevels} A new `LogLevels` instance for CLI logging.
   */
  createLevels: () => {
    return new Level.LogLevels(cliLogLevelsSet);
  },
  /**
   * An array containing the names of all CLI log levels.
   */
  logLevelNames: () => {
    return Object.keys(cliLogLevelsSet);
  },
};
