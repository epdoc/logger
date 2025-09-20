/**
 * This example demonstrates how to setup Log.Mgr to use a custom message builder.
 */
import * as Log from '$logger';
import os from 'node:os';
import { createCustomMsgBuilder, type CustomMsgBuilder as M } from './lib/builder.ts';

type L = Log.Std.Logger<M>;

const filename = new URL(import.meta.url).pathname.split('/').pop();

const _home = os.userInfo().homedir;

const showOpts: Log.EmitterShowOpts = {
  level: true,
  timestamp: Log.TimestampFormat.ELAPSED,
  reqId: true,
  pkg: true,
};

// Create a new Log Manager instance that will use our custom message builder.
export const logMgr = new Log.Mgr<M>({ show: showOpts });
// Register the factory method for the custom message builder.
logMgr.msgBuilderFactory = createCustomMsgBuilder;
// Configure the log output format.
// logMgr.show = { level: true, timestamp: 'elapsed', reqId: true, sid: true, pkg: true };
// Get a logger instance from the manager, casting it to use the custom builder type.
export const log = logMgr.getLogger<L>();
// Set the logging threshold.
logMgr.threshold = 'spam';

// --- Example Usage ---
log.info.section(`Begin ${filename}`).emit();
// A standard log message using the built-in methods.
log.info.h1('h1(header)').label('label(text)').emit();
// A log message using our custom `customSection` method.
log.info.customSection('heading').emit();
// A log message using our custom `errCustom` method.
log.info.errCustom(new Error('my error')).emit();
log.spam.text('Silly text').emit();
log.info.section(`End ${filename}`).emit();
