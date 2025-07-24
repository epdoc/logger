import type { Log } from '../mod.ts';
import { log, logMgr } from './log.ts';

const showOpts: Log.EmitterShowOpts = {
  level: true,
  timestamp: 'elapsed',
  reqId: true,
  package: true,
};

logMgr.show = showOpts;
logMgr.threshold = 'verbose';

const mark = log.mark();
log.info.h2('Hello world').emit();

const line: Log.MsgBuilder.Console = log.info;
const str = line.h3('Hello world').format(true);
line.emit();
log.verbose.h1('String returned by previous call is').value(str).emit();

log.info.section('my section divider').emit();
log.info.h1('Output').pl(5, 'line').h2('to').path('/Users/me/myfiles').emit();
log.info.h1('Actually only output').pl(1, 'line').h2('to').path('console').ewt(mark);
