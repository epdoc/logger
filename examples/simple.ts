import { Log } from '../mod.ts';

type M = Log.MsgBuilder.Console;
const logMgr = new Log.Mgr<M>();
const log = logMgr.getLogger() as Log.std.Logger<M>;
logMgr.setThreshold('verbose');

log.info.text('Hello world').emit();

let line: Log.MsgBuilder.Console = log.info;
line.text('Hello world');
line.emit();

log.info.h1('Output').value('my value').text('to').path('/Users/me/myfiles').emit();
