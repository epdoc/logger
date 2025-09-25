import type { IEmitter, IFactoryMethods, IGetChildParams } from '@epdoc/logger';
import { Mgr as LogMgr } from '@epdoc/logger';
import * as Level from '@epdoc/loglevels';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import * as colors from '@std/fmt/colors';
import { JavaLogger } from './logger.ts';

/**
 * Defines the Java-style log levels and their properties.
 *
 * @remarks
 * This object maps Java log level names to their numeric values, associated
 * formatting functions (for console colors), and special flags like `flush`
 * (for immediate output) and `lowest` (the lowest priority level).
 *
 * Java log levels follow the standard Java logging hierarchy:
 * SEVERE > WARNING > INFO > CONFIG > FINE > FINER > FINEST
 *
 * Note: Both 'warning' (Java standard) and 'warn' (transport compatibility) are included.
 */
const javaLogLevelDefs: Level.LogLevelsDef = {
  severe: { val: 1, fmtFn: colors.red, flush: true },
  warning: { val: 2, fmtFn: colors.yellow, warn: true },
  warn: { val: 2, fmtFn: colors.yellow, warn: true }, // Alias for transport compatibility
  info: { val: 3, fmtFn: colors.green, default: true },
  config: { val: 4, fmtFn: colors.cyan },
  fine: {
    val: 5,
    fmtFn: (str: string) => {
      return colors.dim(colors.blue(str));
    },
  },
  finer: { val: 6, fmtFn: colors.gray },
  finest: {
    val: 7,
    fmtFn: (str: string) => {
      return colors.dim(colors.gray(str));
    },
    lowest: true,
  },
} as const;

/**
 * Factory methods for creating Java-style loggers and log levels.
 */
export const javaFactoryMethods: IFactoryMethods<MsgBuilder.Abstract, JavaLogger<MsgBuilder.Abstract>> = {
  createLogger: <M extends MsgBuilder.Abstract>(
    log: LogMgr<M> | IEmitter,
    params?: IGetChildParams,
  ): JavaLogger<M> => {
    if (log instanceof LogMgr) {
      return new JavaLogger<M>(log, params);
    } else if (log instanceof JavaLogger) {
      return log.getChild(params) as JavaLogger<M>;
    }
    throw new Error('Invalid logger type for Java logger creation');
  },

  createLevels: () => {
    return new Level.LogLevels(javaLogLevelDefs, 'java');
  },

  logLevelNames: () => {
    return Object.keys(javaLogLevelDefs);
  },
};
