import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';

type MsgBuilder = Console.Builder;
// Important: Declare Logger to have CLI logger methods
type Logger = Log.Cli.Logger<MsgBuilder>;

const logMgr = new Log.Mgr<MsgBuilder>();
// Important: Initialize log levels using CLI factory methods
logMgr.initLevels(Log.Cli.factoryMethods);
logMgr.show = {
  level: true,
  timestamp: 'elapsed',
};

logMgr.threshold = 'silly';
const cliLogger = await logMgr.getLogger<Log.Cli.Logger<Console.Builder>>();

cliLogger.info.section('Example 05 - CLI Logger has different levels compared to Std Logger').emit();
cliLogger.info.label('Threshold:').value(logMgr.threshold).value(logMgr.logLevels.asName(logMgr.threshold)).emit();
cliLogger.info.label('Show:').value(JSON.stringify(logMgr.show)).emit();
cliLogger.error.error('An error message').emit();
cliLogger.debug.text('A debug message').emit();
cliLogger.prompt.text('A prompt message').emit();
cliLogger.input.text('An input message').emit();
cliLogger.silly.text('A silly message').emit();
