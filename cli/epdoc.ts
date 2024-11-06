import type { IMsgBuilder } from '@scope/message';

export interface ILogger {
  error: IMsgBuilder;
  warn: IMsgBuilder;
  info: IMsgBuilder;
  debug: IMsgBuilder;
  verbose: IMsgBuilder;
  trace: IMsgBuilder;
  silly: IMsgBuilder;
}
