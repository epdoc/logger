import { Log } from '../mod.ts';

const logMgr = new Log.Mgr('cli');
const log: Log.std.Logger = logMgr.getLogger() as Log.std.Logger;

log.info.h2('Hello, world!').emit();
