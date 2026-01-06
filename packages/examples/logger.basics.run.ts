/**
 * @file Basic logger usage examples
 * @description Demonstrates core logger functionality and setup patterns
 */

import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

// Example 1: Simple logger setup
console.log('=== Example 1: Basic Logger Setup ===');

const basicLogMgr = new Log.Mgr<Console.Builder>();
basicLogMgr.msgBuilderFactory = (emitter) => new Console.Builder(emitter as any);
basicLogMgr.initLevels(Log.Std.factoryMethods);
basicLogMgr.threshold = 'info';
const basicLogger = await basicLogMgr.getLogger<Log.Std.Logger<Console.Builder>>();

basicLogger.info.h1('Basic Logger').text(' - Simple setup').emit();
basicLogger.warn.text('This is a warning message').emit();
basicLogger.debug.text("This debug message won't show (threshold is info)").emit();

// Example 2: Setting show options
console.log('\n=== Example 2: Logger and setting show options ===');

const helperLogMgr = new Log.Mgr<Console.Builder>();
helperLogMgr.msgBuilderFactory = (emitter) => new Console.Builder(emitter as any);
helperLogMgr.initLevels(Log.Std.factoryMethods);
helperLogMgr.threshold = 'debug';
helperLogMgr.show = {
  level: true,
  timestamp: 'elapsed',
};

const helperLogger = await helperLogMgr.getLogger<Log.Std.Logger<Console.Builder>>();
helperLogger.info.text('Created with helper - much simpler!').emit();
helperLogger.debug.text('Debug messages now visible').emit();

// Example 3: Custom message builder
console.log('\n=== Example 3: Custom Message Builder ===');

class CustomBuilder extends Console.Builder {
  constructor(emitter: Log.IEmitter) {
    super(emitter as any);
  }

  apiCall(method: string, endpoint: string) {
    return this.text('[API] ').text(method).text(' ').text(endpoint);
  }

  metric(name: string, value: number, unit = '') {
    return this.text('📊 ').text(name).text(': ').text(value.toString()).text(unit);
  }
}

type CustomLogger = Log.Std.Logger<CustomBuilder>;

const customLogMgr = new Log.Mgr<CustomBuilder>();
customLogMgr.msgBuilderFactory = (emitter) => new CustomBuilder(emitter as any);
customLogMgr.initLevels(Log.Std.factoryMethods);
customLogMgr.threshold = 'info';
const customLogger = await customLogMgr.getLogger<CustomLogger>();

customLogger.info.apiCall('GET', '/api/users').emit();
customLogger.info.metric('Response Time', 245, 'ms').emit();

// Example 4: Different logger types
console.log('\n=== Example 4: CLI vs Standard Logger ===');

// Standard logger (default) - use type assertion for simplicity
const stdLogger = await basicLogMgr.getLogger<Log.Std.Logger<Console.Builder>>();
stdLogger.info.text('Standard logger - full featured').emit();

// CLI logger (simplified for command-line tools)
const cliLogMgr = new Log.Mgr<Console.Builder>();
cliLogMgr.msgBuilderFactory = (emitter) => new Console.Builder(emitter as any); // Assuming Console.Builder is used for CliLogger
cliLogMgr.initLevels(Log.Cli.factoryMethods); // Use Cli factory methods
cliLogMgr.threshold = 'info';
const cliLogger = await cliLogMgr.getLogger<Log.Cli.Logger<Console.Builder>>();
cliLogger.info.text('CLI logger - streamlined for CLI apps').emit();

// Example 5: Logger configuration
console.log('\n=== Example 5: Logger Configuration ===');

const configuredLogMgr = new Log.Mgr<Console.Builder>();
configuredLogMgr.msgBuilderFactory = (emitter) => new Console.Builder(emitter as any);
configuredLogMgr.initLevels(Log.Std.factoryMethods);
configuredLogMgr.threshold = 'debug';
configuredLogMgr.show = {
  level: true,
  timestamp: 'local',
  data: true,
};

const configuredLogger = await configuredLogMgr.getLogger<Log.Std.Logger<Console.Builder>>();
configuredLogger.info.h1('Configured Logger')
  .label('Threshold:').value('debug')
  .label('Timestamp:').value('local')
  .emit();

configuredLogger.debug.text('Debug message is now visible').emit();

console.log('\n=== Summary ===');
console.log('🎯 Extend Console.Builder for custom logging methods');
console.log('📊 Choose between Std.Logger (full) and Cli.Logger (streamlined)');
console.log('⚙️ Configure threshold, timestamps, and display options');
