import * as Log from './src/mod.ts';
import { Console } from '../msgbuilder/src/mod.ts';

type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

const logMgr = new Log.Mgr<MsgBuilder>();
const logger = await logMgr.getLogger<Logger>();

console.log("LogMgr default time setting:", logMgr.show.time);

// Now set time to true to test the display
logMgr.show = { ...logMgr.show, time: true };
console.log("After setting time:true:", logMgr.show.time);

// Test mark/ewt to see if time shows
const m0 = logger.mark('test');
logger.info.text('Hello').ewt(m0);

await logMgr.stop();
