import { Log } from '../mod.ts';
import { log, logMgr } from './log.ts';

const showOpts: Log.EmitterShowOpts = {
  level: true,
  timestamp: 'elapsed',
  reqId: true,
  package: true,
};

logMgr.setShow(showOpts);
logMgr.setThreshold('verbose');

log.info.text('Hello world').emit();

let line: Log.MsgBuilder.Console = log.info;
line.text('Hello world');
line.emit();

log.info.section('my section divider').emit();
log.info.h1('Output').pl(5, 'line').text('to').path('/Users/me/myfiles').emit();
log.info.h1('Actually only output').pl(1, 'line').text('to').path('console').emit();
