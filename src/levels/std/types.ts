import * as colors from '@std/fmt/colors';
import { LogLevels, type LogLevelsDef } from '../base.ts';
import type { LogLevelFactoryMethod } from '../types.ts';
import type { IMsgBuilder } from '../../message/index.ts';

const stdLogLevelDefs: LogLevelsDef = {
  error: { val: 0, fmtFn: colors.red, flush: true },
  warn: { val: 1, fmtFn: colors.yellow },
  info: { val: 2, fmtFn: colors.gray },
  verbose: { val: 3, fmtFn: colors.gray },
  debug: { val: 4, fmtFn: colors.gray },
  trace: { val: 5, fmtFn: colors.gray },
} as const;

export const createLogLevels: LogLevelFactoryMethod = () => {
  return new LogLevels(stdLogLevelDefs);
};

export interface ILogger {
  error: IMsgBuilder;
  warn: IMsgBuilder;
  info: IMsgBuilder;
  verbose: IMsgBuilder;
  debug: IMsgBuilder;
  trace: IMsgBuilder;
}
