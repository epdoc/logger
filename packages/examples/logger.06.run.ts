import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';

type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

const logMgr = new Log.Mgr<MsgBuilder>();
logMgr.initLevels();
logMgr.threshold = 'debug';
logMgr.show = {
  level: true,
  timestamp: 'elapsed',
  data: true,
  time: true,
  pkg: true,
  reqId: true,
};

const logger = await logMgr.getLogger<Log.Std.Logger<Console.Builder>>({ pkg: 'rootPkg' });
const m0 = logger.mark();

logger.info.section('Example 04 - Configuring more output options').emit();
logger.info.label('Threshold:').value(logMgr.threshold).value(logMgr.logLevels.asName(logMgr.threshold)).emit();
logger.info.label('Show:').value(JSON.stringify(logMgr.show)).emit();
logger.info.label('data').data({ foo: 'bar', bar: 123 }).emit();
logger.debug.text('Debug message is now visible').emit();
logger.info.label('Elapsed time will show on this line').ewt(m0);

const childLogger = logger.getChild({ pkg: 'childPkg', reqId: '1234567890' });
childLogger.info.section('Child Logger').emit();
childLogger.info.text('Child loggers extend pkg values, should be created for new HTTP requests').emit();
childLogger.info.label('More data').data({ foo: 'bar', bar: 123 }).emit();
