import { LogMgr, std } from '../mod.ts';

const logMgr = new LogMgr('cli');
const log: std.Logger = logMgr.getLogger() as std.Logger;

log.info.h2('Hello, world!').emit();
