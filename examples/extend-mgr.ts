import { Log } from '../mod.ts';
import { createCustomMsgBuilder } from './builder.ts';

export class LogMgr extends Log.Mgr {
  constructor() {
    super();
    this.threshold = 'info';
    this.show = {
      level: true,
      timestamp: 'elapsed',
      pkg: true,
      sid: true,
      reqId: true,
    };
    this.msgBuilderFactory = createCustomMsgBuilder;
  }

  init() {
  }
}
