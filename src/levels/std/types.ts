import * as colors from '@std/fmt/colors';
import type * as MsgBuilder from '../../message/index.ts';
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

export interface ILogger {
  error: MsgBuilder.IBasic;
  warn: MsgBuilder.IBasic;
  info: MsgBuilder.IBasic;
  verbose: MsgBuilder.IBasic;
  debug: MsgBuilder.IBasic;
  trace: MsgBuilder.IBasic;
  spam: MsgBuilder.IBasic;
}

export const LogLevelNames: string[] = Object.keys(logLevelDefs);
