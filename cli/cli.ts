import type { IMsgBuilder } from '@scope/message';

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
