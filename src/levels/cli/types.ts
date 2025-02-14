import * as colors from '@std/fmt/colors';
import type * as MsgBuilder from '../../message/index.ts';
import { LogLevels } from '../base.ts';
import type * as Level from '../types.ts';

const cliLogLevelDefs: Level.LogLevelsDef = {
  error: { val: 0, fmtFn: colors.red, flush: true },
  warn: { val: 1, fmtFn: colors.yellow },
  help: { val: 2, fmtFn: colors.cyan },
  data: { val: 3, fmtFn: colors.gray },
  info: { val: 4, fmtFn: colors.green, default: true },
  debug: { val: 5, fmtFn: colors.blue },
  prompt: { val: 6, fmtFn: colors.gray },
  verbose: { val: 7, fmtFn: colors.cyan },
  input: { val: 8, fmtFn: colors.gray },
  silly: { val: 9, fmtFn: colors.magenta },
} as const;

export const createLogLevels: Level.FactoryMethod = () => {
  return new LogLevels(cliLogLevelDefs);
};

export interface ILogger<M extends MsgBuilder.IBasic> {
  error: M;
  warn: M;
  help: M;
  data: M;
  info: M;
  debug: M;
  prompt: M;
  verbose: M;
  input: M;
  silly: M;
}

export const LogLevelNames: string[] = Object.keys(cliLogLevelDefs);
