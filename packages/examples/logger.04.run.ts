import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

class CustomBuilder extends Console.Builder {
  constructor(emitter: Log.IEmitter) {
    super(emitter);
  }

  apiCall(method: string, endpoint: string) {
    return this.text('[API] ').text(method).text(' ').text(endpoint);
  }

  metric(name: string, value: number, unit = '') {
    return this.text('📊 ').text(name).text(': ').text(value.toString()).text(unit);
  }
}

type Logger = Log.Std.Logger<CustomBuilder>;

const logMgr = new Log.Mgr<CustomBuilder>();
logMgr.msgBuilderFactory = (emitter) => new CustomBuilder(emitter);
logMgr.initLevels(Log.Std.factoryMethods);
logMgr.show = {
  level: true,
  timestamp: 'elapsed',
};
logMgr.threshold = 'debug';
const logger = await logMgr.getLogger<Logger>();

logger.info.section('Example 04 - Std Logger with custom message builder').emit();
logger.info.label('Transport:').value('Console').emit();
logger.info.label('Threshold:').value(logMgr.threshold).value(logMgr.logLevels.asName(logMgr.threshold)).emit();
logger.info.label('Show:').value(JSON.stringify(logMgr.show)).emit();
logger.info.apiCall('GET', '/api/users').emit();
logger.info.metric('Response Time', 245, 'ms').emit();
logger.error.error('This is an error message').emit();
logger.debug.text('This debug message will show (threshold is debug)').emit();
