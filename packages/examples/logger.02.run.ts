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
logMgr.threshold = 'info'; // redundant, because this is the default for std logger
const logger = await logMgr.getLogger<Log.Std.Logger<Console.Builder>>();

logger.info.section('Example 02 - Std Logger explicit setup').emit();
logger.info.h1('Std Logger').text(' - Explicit setup').emit();
logger.info.label('Transport:').value('Console').emit();
logger.info.label('Threshold:').value(logMgr.threshold).value(logMgr.logLevels.asSpec(logMgr.threshold)!.name).emit();
logger.info.label('Show:').value(JSON.stringify(logMgr.show)).emit();

logger.warn.warn('This is a warning message').emit();
logger.debug.text("This debug message won't show (threshold is info)").emit();
