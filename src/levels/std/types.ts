import * as colors from '@std/fmt/colors';
import { LogLevels } from '../base.ts';
import type * as Level from '../types.ts';

const logLevelDefs: Level.LogLevelsDef = {
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

export const createLogLevels: Level.FactoryMethod = () => {
  return new LogLevels(logLevelDefs);
};

export interface ILogger<M> {
  error: M;
  warn: M;
  info: M;
  verbose: M;
  debug: M;
  trace: M;
  spam: M;
}

export const LogLevelNames: string[] = Object.keys(logLevelDefs);
