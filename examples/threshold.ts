/**
 * This example demonstrates the effects of configuring timestamps and how
 * log level thresholds on the LogMgr and individual loggers interact.
 */
import { Log } from '../mod.ts';

// 1. SETUP
// Get a standard logger instance.
const logMgr = new Log.Mgr();
const log = logMgr.getLogger<Log.Std.Logger<Log.MsgBuilder.Console.Builder>>();

console.log('--- Timestamp Examples ---');

// 2. DEFAULT TIMESTAMP
// By default, no timestamp is shown.
log.info.h2('This is a log message with the default (no) timestamp.').emit();

// 3. ELAPSED TIMESTAMP
// Show the time elapsed since the LogMgr was created.
logMgr.show = { timestamp: Log.TimestampFormat.ELAPSED, level: true };
log.info.h2('This message shows the elapsed time.').emit();

// 4. LOCAL TIMESTAMP
// Show the timestamp in the local time zone.
logMgr.show = { timestamp: Log.TimestampFormat.LOCAL, level: true };
log.info.h2('This message shows the local timestamp.').emit();

// 5. UTC TIMESTAMP
// Show the timestamp in UTC.
logMgr.show = { timestamp: Log.TimestampFormat.UTC, level: true };
log.info.h2('This message shows the UTC timestamp.').emit();

// Reset for the next section
logMgr.show = {};
console.log('\n--- Threshold Examples ---');

// 6. LOGMGR THRESHOLD
// Set the LogMgr threshold to 'info'. Only messages at 'info' level or
// higher (warn, error) will be processed.
logMgr.threshold = 'info';
console.log(`LogMgr threshold: ${logMgr.threshold}, Logger threshold: ${log.threshold}`);
log.debug.h2('This debug message will NOT be seen.').emit();
log.info.h2('This info message WILL be seen.').emit();
log.warn.h2('This warn message WILL be seen.').emit();

// 7. MORE RESTRICTIVE LOGGER THRESHOLD
// Set the logger's threshold to 'warn'. This is more restrictive than the
// LogMgr's threshold of 'info'. The most restrictive level is used.
console.log("\nSetting logger threshold to 'warn'...");
log.threshold = 'warn';
console.log(`LogMgr threshold: ${logMgr.threshold}, Logger threshold: ${log.threshold}`);
log.info.h2('This info message will NOT be seen.').emit();
log.warn.h2('This warn message WILL be seen.').emit();

// 8. LESS RESTRICTIVE LOGGER THRESHOLD
// Set the logger's threshold to 'debug'. This is less restrictive than the
// LogMgr's threshold of 'info'. The LogMgr's more restrictive level is used.
console.log("\nSetting logger threshold to 'debug'...");
log.threshold = 'debug';
console.log(`LogMgr threshold: ${logMgr.threshold}, Logger threshold: ${log.threshold}`);
log.debug.h2('This debug message will NOT be seen.').emit();
log.info.h2('This info message WILL be seen, and the debug message above this line will NOT be seen.').emit();
