import type { IMsgBuilder } from '@epdoc/message';

export interface ILogger {
  error: IMsgBuilder;
  warn: IMsgBuilder;
  info: IMsgBuilder;
  verbose: IMsgBuilder;
  debug: IMsgBuilder;
  trace: IMsgBuilder;
}
