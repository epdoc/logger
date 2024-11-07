import type { IMsgBuilder } from '@epdoc/message';

export interface ILogger {
  error: IMsgBuilder;
  warn: IMsgBuilder;
  info: IMsgBuilder;
  debug: IMsgBuilder;
  verbose: IMsgBuilder;
  trace: IMsgBuilder;
  silly: IMsgBuilder;
}
