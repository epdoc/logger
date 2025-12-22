/**
 * @file Logger helper example
 * @description Demonstrates the createLogManager helper for simplified setup
 */

import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

// Example 1: Basic usage with default builder
console.log('=== Example 1: Basic Usage ===');
const basicLogMgr = Log.createLogManager(undefined, {
  threshold: 'info',
  showLevel: true,
  showTimestamp: 'elapsed',
});

// Declare our types
// This indicates which Logger and MsgBuilder API we are using.
type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

const basicLogger = basicLogMgr.getLogger<Logger>();
basicLogger.info.h1('Basic Logger').text(' - Simple setup').emit();

// Example 2: Custom builder with project-specific methods
console.log('\n=== Example 2: Custom Builder ===');
const ProjectBuilder = Console.extender({
  // API logging
  apiCall(method: string, endpoint: string) {
    return this.text('[API]').text(' ').text(method).text(' ').text(endpoint);
  },

  // Performance metrics
  metric(name: string, value: number, unit = '') {
    return this.text('[METRIC]').text(' ').text(name).text(': ').text(value.toString()).text(unit);
  },

  // File operations
  fileOp(operation: string, path: string) {
    return this.text('[FILE]').text(' ').text(operation).text(' ').path(path);
  },
});

type ProjectBuilderType = InstanceType<typeof ProjectBuilder>;
const projectLogMgr = Log.createLogManager(ProjectBuilder, {
  threshold: 'debug',
  showLevel: true,
  showTimestamp: 'local',
});

const projectLogger = projectLogMgr.getLogger<Log.Std.Logger<ProjectBuilderType>>();

// Demonstrate custom methods - now with proper typing
projectLogger.info.apiCall('GET', '/api/users').emit();
projectLogger.info.metric('response_time', 245, 'ms').emit();
projectLogger.debug.fileOp('READ', '/tmp/config.json').emit();

// Example 3: Migration comparison
console.log('\n=== Example 3: Before vs After ===');

// Before: Complex setup (like finsync project)
console.log('// Before: Complex factory setup');
console.log('// const msgBuilderFactory = (emitter) => new CustomMsgBuilder(emitter);');
console.log('// const logMgr = new Log.Mgr();');
console.log('// logMgr.msgBuilderFactory = msgBuilderFactory;');
console.log('// logMgr.init();');
console.log('// logMgr.threshold = "info";');

// After: Simple one-liner
console.log('\n// After: Simple helper');
console.log('// const logMgr = Log.createLogManager(CustomBuilder, { threshold: "info" });');

const simpleLogMgr = Log.createLogManager(ProjectBuilder, { threshold: 'info' });
const simpleLogger = simpleLogMgr.getLogger<Log.Std.Logger<ProjectBuilderType>>();
simpleLogger.info.h1('Migration Complete').text(' - 70% less boilerplate!').emit();

// Example 4: Real-world usage pattern
console.log('\n=== Example 4: Real-world Pattern ===');

// This is how projects like bond-fan, finsync, etc. can now set up logging
const AppBuilder = Console.extender({
  startup(component: string) {
    return this.text('🚀').text(' Starting ').text(component);
  },

  config(key: string, value: string) {
    return this.text('⚙️').text(' Config: ').text(key).text(' = ').value(value);
  },

  success(message: string) {
    return this.text('✅').text(' ').text(message);
  },

  failure(message: string) {
    return this.text('❌').text(' ').text(message);
  },
});

type AppBuilderType = InstanceType<typeof AppBuilder>;
const appLogMgr = Log.createLogManager(AppBuilder, {
  threshold: 'info',
  showLevel: false,
  showTimestamp: 'elapsed',
});

const appLogger = appLogMgr.getLogger<Log.Std.Logger<AppBuilderType>>();

// Now with proper typing - no more type assertions needed!
appLogger.info.startup('Application').emit();
appLogger.info.config('port', '3000').emit();
appLogger.info.success('Server ready').emit();

console.log('\n=== Summary ===');
console.log('✨ The createLogManager helper eliminates complex factory setup');
console.log('🎯 Projects can now easily add custom logging methods');
console.log('📦 Works seamlessly with the Console.extender helper');
console.log('🔄 Maintains full backward compatibility');
console.log('📈 Reduces CLI setup boilerplate by ~70%');
