/**
 * @file Basic logger usage examples
 * @description Demonstrates core logger functionality and setup patterns
 */

import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

// Example 1: Simple logger setup
console.log('=== Example 1: Basic Logger Setup ===');

const basicLogMgr = new Log.Mgr<Console.Builder>().init();
basicLogMgr.threshold = 'info';
const basicLogger = basicLogMgr.getLogger() as Log.Std.Logger<Console.Builder>;

basicLogger.info.h1('Basic Logger').text(' - Simple setup').emit();
basicLogger.warn.text('This is a warning message').emit();
basicLogger.debug.text('This debug message won\'t show (threshold is info)').emit();

// Example 2: Using the new createLogManager helper
console.log('\n=== Example 2: Using createLogManager Helper ===');

const helperLogMgr = Log.createLogManager(undefined, {
  threshold: 'debug',
  showLevel: true,
  showTimestamp: 'elapsed',
});

const helperLogger = helperLogMgr.getLogger() as Log.Std.Logger<Console.Builder>;
helperLogger.info.text('Created with helper - much simpler!').emit();
helperLogger.debug.text('Debug messages now visible').emit();

// Example 3: Custom message builder
console.log('\n=== Example 3: Custom Message Builder ===');

const CustomBuilder = Console.extender({
  apiCall(method: string, endpoint: string) {
    return this.text('[API] ').text(method).text(' ').text(endpoint);
  },
  
  metric(name: string, value: number, unit = '') {
    return this.text('📊 ').text(name).text(': ').text(value.toString()).text(unit);
  },
});

type CustomLogger = Log.Std.Logger<InstanceType<typeof CustomBuilder>>;

const customLogMgr = Log.createLogManager(CustomBuilder, { threshold: 'info' });
const customLogger = customLogMgr.getLogger<CustomLogger>();

customLogger.info.apiCall('GET', '/api/users').emit();
customLogger.info.metric('Response Time', 245, 'ms').emit();

// Example 4: Different logger types
console.log('\n=== Example 4: CLI vs Standard Logger ===');

// Standard logger (default) - use type assertion for simplicity
const stdLogger = basicLogMgr.getLogger() as Log.Std.Logger<Console.Builder>;
stdLogger.info.text('Standard logger - full featured').emit();

// CLI logger (simplified for command-line tools)
const cliLogMgr = Log.createLogManager(undefined, { threshold: 'info' });
const cliLogger = cliLogMgr.getLogger() as Log.Cli.Logger<Console.Builder>;
cliLogger.info.text('CLI logger - streamlined for CLI apps').emit();

// Example 5: Logger configuration
console.log('\n=== Example 5: Logger Configuration ===');

const configuredLogMgr = Log.createLogManager(undefined, {
  threshold: 'debug',
  showLevel: true,
  showTimestamp: 'local',
  showData: true,
});

const configuredLogger = configuredLogMgr.getLogger() as Log.Std.Logger<Console.Builder>;
configuredLogger.info.h1('Configured Logger')
  .label('Threshold:').value('debug')
  .label('Timestamp:').value('local')
  .emit();

configuredLogger.debug.text('Debug message is now visible').emit();

console.log('\n=== Summary ===');
console.log('✨ Use Log.createLogManager() for simple setup');
console.log('🎯 Extend Console.Builder for custom logging methods');
console.log('📊 Choose between Std.Logger (full) and Cli.Logger (streamlined)');
console.log('⚙️ Configure threshold, timestamps, and display options');
