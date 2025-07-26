import { createStdLogger, createStdLogLevels, stdLogLevelNames } from './consts.ts';
import { StdLogger } from './logger.ts';
import type { IStdLogger } from './types.ts';

// Re-export the class under the desired name 'Builder'
export {
  createStdLogger as createLogger,
  createStdLogLevels as createLogLevels,
  StdLogger as Logger,
  stdLogLevelNames as logLevelNames,
};
export type { IStdLogger as ILogger };
