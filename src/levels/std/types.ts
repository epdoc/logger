import * as colors from '@std/fmt/colors';
import type { IMsgBuilder } from '../../message/index.ts';
import { LogLevels, type LogLevelsDef } from '../base.ts';
import type { LogLevelFactoryMethod } from '../types.ts';

const logLevelDefs: LogLevelsDef = {
  error: { val: 0, fmtFn: colors.red, flush: true },
  warn: { val: 1, fmtFn: colors.brightYellow },
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
  },
} as const;

export const createLogLevels: LogLevelFactoryMethod = () => {
  return new LogLevels(logLevelDefs);
};

export interface ILogger {
  error: IMsgBuilder;
  warn: IMsgBuilder;
  info: IMsgBuilder;
  verbose: IMsgBuilder;
  debug: IMsgBuilder;
  trace: IMsgBuilder;
  spam: IMsgBuilder;
}

export const LogLevelNames: string[] = Object.keys(logLevelDefs);
