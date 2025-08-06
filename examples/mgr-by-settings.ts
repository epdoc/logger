/**
 * This example demonstrates how to create and use a custom message builder
 * to extend the functionality of the logger.
 */
import os from 'node:os';
import * as Log from '../mod.ts';
import { createCustomMsgBuilder, type CustomMsgBuilder } from './lib/builder.ts';

type M = CustomMsgBuilder;
type L = Log.Cli.Logger<M>;

const filename = new URL(import.meta.url).pathname.split('/').pop();

const _home = os.userInfo().homedir;

// Create a new Log Manager instance that will use our custom message builder.
export const logMgr = new Log.Mgr<M>();
// Register the factory method for the custom message builder.
logMgr.msgBuilderFactory = createCustomMsgBuilder;
// Configure the log output format.
logMgr.show = { level: true, timestamp: 'elapsed', reqId: true, sid: true, pkg: true };
logMgr.init();
// Set the logging threshold.
logMgr.threshold = 'info';
// Get a logger instance from the manager, casting it to use the custom builder type.
export const log = logMgr.getLogger<Log.Std.Logger<CustomMsgBuilder>>();

// --- Example Usage ---
log.info.section(`Begin ${filename}`).emit();
// A standard log message using the built-in methods.
log.info.h1('h1(header)').label('label(text)').emit();
// A log message using our custom `customSection` method.
log.info.customSection('heading').emit();
// A log message using our custom `errCustom` method.
log.info.errCustom(new Error('my error')).emit();
log.info.section(`End ${filename}`).emit();
