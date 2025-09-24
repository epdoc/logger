#!/usr/bin/env -S deno run -A
import type * as Log from '../packages/logger/src/mod.ts';
import { log, logMgr } from './settings-mgr.ts';

const showOpts: Log.EmitterShowOpts = {
  level: true,
  timestamp: 'elapsed',
  reqId: true,
  pkg: true,
};

logMgr.show = showOpts;
logMgr.threshold = 'verbose';

const mark = log.mark();
log.info.section('Start custom_builder.ts').emit();
log.info.h2('Hello world').emit();

const line: Log.MsgBuilder.Console.Builder = log.info;
const str = line.h3('Hello world').format(true);
line.emit();
log.verbose.h1('String returned by previous call is').value(str).emit();

log.info.section('my section divider').emit();
log.info.h1('Output').pl(5, 'line').h2('to').path('/Users/me/myfiles').emit();
log.info.h1('Actually only output').pl(1, 'line').h2('to').path('console').ewt(mark);
log.info.section('Finish').emit();
