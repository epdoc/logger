/**
 * @file Basic logger usage examples
 * @description Demonstrates core logger functionality and setup patterns
 */

import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

// Example 4: Different logger types
console.log('\n=== Example 4: CLI vs Standard Logger ===');

// Standard logger (default) - use type assertion for simplicity
const stdLogger = await basicLogMgr.getLogger<Log.Std.Logger<Console.Builder>>();
stdLogger.info.text('Standard logger - full featured').emit();

// CLI logger (simplified for command-line tools)
const cliLogMgr = new Log.Mgr<Console.Builder>();
cliLogMgr.msgBuilderFactory = (emitter) => new Console.Builder(emitter); // Assuming Console.Builder is used for CliLogger
cliLogMgr.initLevels(Log.Cli.factoryMethods); // Use Cli factory methods
cliLogMgr.threshold = 'info';
const cliLogger = await cliLogMgr.getLogger<Log.Cli.Logger<Console.Builder>>();
cliLogger.info.text('CLI logger - streamlined for CLI apps').emit();

// Example 5: Logger configuration
console.log('\n=== Example 5: Logger Configuration ===');

const configuredLogMgr = new Log.Mgr<Console.Builder>();
configuredLogMgr.msgBuilderFactory = (emitter) => new Console.Builder(emitter);
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
