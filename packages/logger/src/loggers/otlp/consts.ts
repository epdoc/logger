import * as Level from '@epdoc/loglevels';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import * as colors from '@std/fmt/colors';
import { LogMgr } from '../../logmgr.ts';
import type * as Base from '../base/mod.ts';
import type { IFactoryMethods } from '../factory.ts';
import { OtlpLogger } from './logger.ts';

/**
 * Defines the standard log levels and their properties.
 *
 * @remarks
 * This object maps common log level names (e.g., 'error', 'info') to their
 * numeric values, associated formatting functions (for console colors), and
 * special flags like `flush` (for immediate output) and `lowest` (the lowest
 * priority level).
 */
const otlpLogLevelsSet: Level.LogLevelsSet = {
  id: 'std',
  levels: {
    fatal: { val: 21, fmtFn: colors.brightRed, flush: true, icon: '☠' },
    error: { val: 17, fmtFn: colors.red, flush: true, icon: '✗' },
    warn: { val: 13, fmtFn: colors.yellow, warn: true, icon: '⚠' },
    info: { val: 9, fmtFn: colors.green, default: true, icon: 'ℹ' },
    debug: {
      val: 5,
      fmtFn: (str: string) => {
        return colors.dim(colors.blue(str));
      },
      icon: 'Δ',
    },
    trace: { val: 1, fmtFn: colors.gray, icon: '↳' },
  },
} as const;

export const otlpFactoryMethods: IFactoryMethods<MsgBuilder.Abstract, OtlpLogger<MsgBuilder.Abstract>> = {
  createLogger: <M extends MsgBuilder.Abstract>(
    log: LogMgr<M> | Base.IEmitter,
    params?: Base.IGetChildParams,
  ): OtlpLogger<M> => {
    if (log instanceof LogMgr) {
      return new OtlpLogger<M>(log, params);
    } else if (log instanceof OtlpLogger) {
      return log.getChild(params) as OtlpLogger<M>;
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
    return new Level.LogLevels(otlpLogLevelsSet);
  },
  /**
   * An array containing the names of all CLI log levels.
   */
  logLevelNames: () => {
    return Object.keys(otlpLogLevelsSet);
  },
};
