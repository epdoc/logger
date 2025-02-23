import { Log } from '../mod.ts';

type M = Log.MsgBuilder.Console;

const logMgr = new Log.Mgr<M>();
logMgr.threshold = 'verbose';
const log = logMgr.getLogger() as Log.std.Logger<M>;

log.info.h2('Hello, world!').emit();
