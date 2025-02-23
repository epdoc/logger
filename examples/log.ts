import { asError } from '@epdoc/type';
import os from 'node:os';
import { Log } from '../mod.ts';

const home = os.userInfo().homedir;

const createCustomMsgBuilder: Log.MsgBuilder.FactoryMethod = (
  level: Log.Level.Name,
  params: Log.IParams,
  emitter: Log.IEmitter,
  meetsThreshold: boolean
) => {
  return new CustomMsgBuilder(level, params, emitter, meetsThreshold);
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

export const logMgr = new Log.Mgr<CustomMsgBuilder>();
logMgr.msgBuilderFactory = createCustomMsgBuilder;
logMgr.show = { level: true, timestamp: 'elapsed', reqId: true, sid: true, package: true };
logMgr.threshold = 'info';
export const log = logMgr.getLogger() as Log.std.Logger<CustomMsgBuilder>;

log.info.h1('h1(header)').label('label(text)').emit();
log.info.section('heading').emit();
log.info.err(new Error('my error')).emit();
