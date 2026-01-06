import type * as MsgBuilder from '@epdoc/msgbuilder';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;
type L = Log.Std.Logger<M>;

const logMgr = new Log.Mgr<M>().initLevels();
logMgr.threshold = 'verbose';
const log = await logMgr.getLogger<L>();

log.info.h2('Hello, world!').emit();
