/**
 * @file Basic logger usage examples
 * @description Demonstrates the default logger setup and usage
 */

import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';

type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

const logMgr = new Log.Mgr<MsgBuilder>();
const logger = await logMgr.getLogger<Logger>();

logger.info.section('Example 01 - Std Logger default setup').emit();
logger.info.label('Transport:').value('Console').emit();
logger.info.label('Threshold:').value(logMgr.threshold).value(logMgr.logLevels.asName(logMgr.threshold)).emit();
logger.info.label('Show:').value(JSON.stringify(logMgr.show)).emit();
logger.warn.warn('This is a warning message').emit();
logger.debug.text("This debug message won't show (threshold is info)").emit();
logger.spam.text("This spam message won't show (threshold is info)").emit();
