import { Log } from '../mod.ts';

const showOpts: Log.EmitterShowOpts = {
  level: true,
  timestamp: 'elapsed',
  reqId: true,
  package: true,
};

const logMgr = new Log.Mgr().setShow(showOpts);
const log = logMgr.getLogger('std') as Log.std.Logger;
logMgr.setThreshold('verbose');

log.info.text('Hello world').emit();

let line: Log.MsgBuilder.Console = log.info;
line.text('Hello world');
line.emit();

log.info.h1('Output').value('my value').text('to').path('/Users/me/myfiles').emit();
