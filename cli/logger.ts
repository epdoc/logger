import { cli } from '@epdoc/levels';
import * as core from '@epdoc/logcore';
import { MsgBuilder } from '@epdoc/msgconsole';
import type { ILogger } from './cli.ts';

export class Logger extends core.Logger implements ILogger {
  constructor() {
    super();
    this._logLevels = cli.createLogLevels();
    this._threshold = this._logLevels.asValue(this._logLevels.defaultLevelName);
  }

  override emit(msg: core.LogRecord): void {
    if (this.meetsThreshold(msg.level)) {
      console.log(msg.msg);
    }
  }

  get error(): MsgBuilder {
    return new MsgBuilder('ERROR', this);
  }
  get warn(): MsgBuilder {
    return new MsgBuilder('WARN', this);
  }
  get help(): MsgBuilder {
    return new MsgBuilder('HELP', this);
  }
  get data(): MsgBuilder {
    return new MsgBuilder('DATA', this);
  }
  get info(): MsgBuilder {
    return new MsgBuilder('INFO', this);
  }
  get debug(): MsgBuilder {
    return new MsgBuilder('DEBUG', this);
  }
  get prompt(): MsgBuilder {
    return new MsgBuilder('PROMPT', this);
  }
  get verbose(): MsgBuilder {
    return new MsgBuilder('VERBOSE', this);
  }
  get input(): MsgBuilder {
    return new MsgBuilder('INPUT', this);
  }
  get silly(): MsgBuilder {
    return new MsgBuilder('SILLY', this);
  }
}
