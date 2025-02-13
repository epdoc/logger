import { asError } from '@epdoc/type';
import os from 'node:os';
import { Log } from '../mod.ts';

const home = os.userInfo().homedir;

const createCustomMsgBuilder: Log.MsgBuilder.FactoryMethod = (
  level: Log.Level.Name,
  emitter?: Log.Logger.IEmitter
) => {
  return new CustomMsgBuilder(level, emitter);
};

export class CustomMsgBuilder extends Log.MsgBuilder.Console {
  section(str: string): this {
    const len = (80 - str.length) / 2;
    return this.h1('-'.repeat(Math.floor(len)))
      .h1(str)
      .h1('-'.repeat(Math.ceil(len)));
  }

  pl(num: number, singular: string, plural?: string): this {
    return this.value(num + ' ' + (num === 1 ? singular : plural ? plural : singular + 's'));
  }

  err(error: unknown, stack = false): this {
    const err = asError(error);
    this.error(err.message);
    if (err.cause) {
      this.label('cause:').value(err.cause);
    }
    // if (stack && this.emitter.meetsThreshold('debug')) {
    //   this.text('\n' + err.stack);
    // }
    return this;
  }
}

export const logMgr = new Log.Mgr<CustomMsgBuilder>(createCustomMsgBuilder);
export const log = logMgr.getLogger() as Log.std.Logger<CustomMsgBuilder>;
logMgr.setThreshold('info');
