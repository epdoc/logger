import type { IMsgBuilder } from '@epdoc/message';

export interface ILogger {
  error: IMsgBuilder;
  warn: IMsgBuilder;
  help: IMsgBuilder;
  data: IMsgBuilder;
  info: IMsgBuilder;
  debug: IMsgBuilder;
  prompt: IMsgBuilder;
  verbose: IMsgBuilder;
  input: IMsgBuilder;
  silly: IMsgBuilder;
}
