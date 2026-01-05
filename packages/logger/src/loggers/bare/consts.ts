import * as Level from '@epdoc/loglevels';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import * as colors from '@std/fmt/colors';
import { LogMgr } from '../../logmgr.ts';
import type * as Base from '../base/mod.ts';
import type { IFactoryMethods } from '../factory.ts';
import { BareLogger } from './logger.ts';

/**
 * Defines the standard log levels and their properties.
 *
 * @remarks
 * This object maps common log level names (e.g., 'error', 'info') to their
 * numeric values, associated formatting functions (for console colors), and
 * special flags like `flush` (for immediate output) and `lowest` (the lowest
 * priority level).
 */
const bareLogLevelDefs: Level.LogLevelMap = {
  warn: { val: 2, fmtFn: colors.yellow, warn: true },
  info: { val: 3, fmtFn: colors.green, default: true },
} as const;

export const bareFactoryMethods: IFactoryMethods<MsgBuilder.Abstract, BareLogger<MsgBuilder.Abstract>> = {
  createLogger: <M extends MsgBuilder.Abstract>(
    log: LogMgr<M> | Base.IEmitter,
    params?: Base.IGetChildParams,
  ): BareLogger<M> => {
    if (log instanceof LogMgr) {
      return new BareLogger<M>(log, params);
    } else if (log instanceof BareLogger) {
      return log.getChild(params) as BareLogger<M>;
    }
    throw new Error('Invalid logger type');
  },
  /**
   * Factory method to create an instance of {@link LogLevels} configured with
   * the CLI-specific log level definitions.
   *
   * @returns A new `LogLevels` instance for CLI logging.
   */
  createLevels: () => {
    return new Level.LogLevels(bareLogLevelDefs, 'bare');
  },
  /**
   * An array containing the names of all CLI log levels.
   */
  logLevelNames: () => {
    return Object.keys(bareLogLevelDefs);
  },
};
