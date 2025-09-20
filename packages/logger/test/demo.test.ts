import * as Log from '../mod.ts';

type M = Log.MsgBuilder.Console.Builder;
type L = Log.Std.Logger<M>;

const logMgr = new Log.Mgr<M>().init();
logMgr.threshold = 'verbose';
const log = logMgr.getLogger<L>();

log.info.h2('Hello, world!').emit();
