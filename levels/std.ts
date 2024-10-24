import * as colors from '@std/fmt/colors';
import { LogLevels, type LogLevelsDef } from './base.ts';
import type { LogLevelFactoryMethod } from './types.ts';

const stdLogLevelDefs: LogLevelsDef = {
  error: { val: 0, fmtFn: colors.red, flush: true },
  warn: { val: 1, fmtFn: colors.yellow },
  info: { val: 2, fmtFn: colors.green },
  verbose: { val: 3, fmtFn: colors.cyan },
  debug: { val: 4, fmtFn: colors.blue },
  trace: { val: 5, fmtFn: colors.gray },
} as const;

export const createLogLevels: LogLevelFactoryMethod = () => {
  return new LogLevels(stdLogLevelDefs);
};
