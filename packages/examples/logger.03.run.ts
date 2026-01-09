import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';

type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

const logMgr = new Log.Mgr<MsgBuilder>();
logMgr.initLevels(Log.Std.factoryMethods);
logMgr.show = {
  level: true,
  timestamp: 'elapsed',
};
const logger = await logMgr.getLogger<Log.Std.Logger<Console.Builder>>();

logger.info.section('Example 03 - Std Logger show level and timestamp').emit();
logger.info.label('Transport:').value('Console').emit();
logger.info.label('Threshold:').value(logMgr.threshold).value(logMgr.logLevels.asName(logMgr.threshold)).emit();
logger.info.label('Show:').value(JSON.stringify(logMgr.show)).emit();
logger.error.error('This is an error message').emit();
logger.debug.text("This debug message won't show (threshold is info)").emit();
