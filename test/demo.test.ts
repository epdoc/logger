import { LogMgr, StdLogger } from '../mod.ts';

const logMgr = new LogMgr('cli');
const log: StdLogger = logMgr.getLogger() as StdLogger;

log.info.h2('Hello, world!').emit();
