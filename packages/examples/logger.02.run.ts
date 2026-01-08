/**
 * @file Basic logger usage examples
 * @description Demonstrates the default logger setup and usage
 */

import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

const logMgr = new Log.Mgr<MsgBuilder>();
logMgr.msgBuilderFactory = (emitter) => new Console.Builder(emitter);
logMgr.initLevels(Log.Std.factoryMethods);
logMgr.threshold = 'info';
const logger = await logMgr.getLogger<Log.Std.Logger<Console.Builder>>();

logger.info.h1('Basic Logger').text(' - Explicit setup').emit();
logger.warn.warn('This is a warning message').emit();
logger.debug.text("This debug message won't show (threshold is info)").emit();
