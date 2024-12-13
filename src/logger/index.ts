import * as cli from './cli/index.ts';
import * as std from './std/index.ts';

export { getLogger as getCliLogger, Logger as CliLogger } from './cli/index.ts';
export { Logger } from './logger.ts';
export { getLogger as getStdLogger, Logger as StdLogger } from './std/index.ts';
export * from './types.ts';

export const logger = {
  cli: cli,
  std: std,
};
