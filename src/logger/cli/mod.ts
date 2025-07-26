import { cliLogLevelNames, createCliLogger, createCliLogLevels } from './consts.ts';
import { CliLogger } from './logger.ts';
import type { ICliLogger } from './types.ts';

// Re-export the class under the desired name 'Builder'
export {
  CliLogger as Logger,
  cliLogLevelNames as logLevelNames,
  createCliLogger as createLogger,
  createCliLogLevels as createLogLevels,
};
export type { ICliLogger as ILogger };
