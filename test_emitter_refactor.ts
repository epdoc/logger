#!/usr/bin/env -S deno run -A

import * as Log from './packages/logger/src/mod.ts';

// Test the IEmitter refactor
console.log('Testing IEmitter refactor...');

// Create a log manager
const logMgr = new Log.Mgr();

// Get a logger (this will initialize the manager)
const logger = logMgr.getLogger<Log.Std.Logger>();

// Set threshold to see all messages
logMgr.threshold = 'debug';

// Test basic logging
logger.info.text('Hello from refactored logger!').emit();
logger.debug.text('Debug message').emit();
logger.error.text('Error message').emit();

// Test with context
const childLogger = logger.getChild({ pkg: 'TestModule', reqId: 'req-123' });
childLogger.info.text('Message from child logger').emit();

// Test data logging
logger.info.text('Message with data').data({ key: 'value', number: 42 }).emit();

console.log('IEmitter refactor test completed successfully!');
