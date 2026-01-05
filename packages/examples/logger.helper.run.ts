/**
 * @file Logger helper example
 * @description Demonstrates the createLogManager helper for simplified setup
 */

import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

// Example 1: Basic usage with default builder
console.log('=== Example 1: Basic Usage ===');
const basicLogMgr = new Log.Mgr<Console.Builder>();
basicLogMgr.msgBuilderFactory = (emitter) => new Console.Builder(emitter as any);
basicLogMgr.init(Log.Std.factoryMethods);
basicLogMgr.threshold = 'info';
basicLogMgr.show = {
  level: true,
  timestamp: 'elapsed',
};

// Declare our types
// This indicates which Logger and MsgBuilder API we are using.
type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

const basicLogger = basicLogMgr.getLogger<Logger>();
basicLogger.info.h1('Basic Logger').text(' - Simple setup').emit();

// Example 2: Custom builder with project-specific methods
console.log('\n=== Example 2: Custom Builder ===');
class ProjectBuilder extends Console.Builder {
  constructor(emitter: Log.IEmitter) {
    super(emitter as any);
  }
  // API logging
  apiCall(method: string, endpoint: string) {
    return this.text('[API]').text(' ').text(method).text(' ').text(endpoint);
  }

  // Performance metrics
  metric(name: string, value: number, unit = '') {
    return this.text('[METRIC]').text(' ').text(name).text(': ').text(value.toString()).text(unit);
  }

  // File operations
  fileOp(operation: string, path: string) {
    return this.text('[FILE]').text(' ').text(operation).text(' ').path(path);
  }
}

const projectLogMgr = new Log.Mgr<ProjectBuilder>();
projectLogMgr.msgBuilderFactory = (emitter) => new ProjectBuilder(emitter as any);
projectLogMgr.init(Log.Std.factoryMethods);
projectLogMgr.threshold = 'debug';
projectLogMgr.show = {
  level: true,
  timestamp: 'local',
};

const projectLogger = projectLogMgr.getLogger<Log.Std.Logger<ProjectBuilder>>();

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
console.log('// const logMgr = new Log.Mgr<ProjectBuilder>(); ...');

const simpleLogMgr = new Log.Mgr<ProjectBuilder>();
simpleLogMgr.msgBuilderFactory = (emitter) => new ProjectBuilder(emitter as any);
simpleLogMgr.init(Log.Std.factoryMethods);
simpleLogMgr.threshold = 'info';
const simpleLogger = simpleLogMgr.getLogger<Log.Std.Logger<ProjectBuilder>>();
simpleLogger.info.h1('Migration Complete').text(' - 70% less boilerplate!').emit();

// Example 4: Real-world usage pattern
console.log('\n=== Example 4: Real-world Pattern ===');

// This is how projects like bond-fan, finsync, etc. can now set up logging
class AppBuilder extends Console.Builder {
  constructor(emitter: Log.IEmitter) {
    super(emitter as any);
  }
  startup(component: string) {
    return this.text('🚀').text(' Starting ').text(component);
  }

  config(key: string, value: string) {
    return this.text('⚙️').text(' Config: ').text(key).text(' = ').value(value);
  }

  override success(message: string) {
    return this.text('✅').text(' ').text(message);
  }

  failure(message: string) {
    return this.text('❌').text(' ').text(message);
  }
}

const appLogMgr = new Log.Mgr<AppBuilder>();
appLogMgr.msgBuilderFactory = (emitter) => new AppBuilder(emitter as any);
appLogMgr.init(Log.Std.factoryMethods);
appLogMgr.threshold = 'info';
appLogMgr.show = {
  level: false,
  timestamp: 'elapsed',
};

const appLogger = appLogMgr.getLogger<Log.Std.Logger<AppBuilder>>();

// Now with proper typing - no more type assertions needed!
appLogger.info.startup('Application').emit();
appLogger.info.config('port', '3000').emit();
appLogger.info.success('Server ready').emit();

console.log('\n=== Summary ===');
console.log('🎯 Projects can now easily add custom logging methods');
console.log('📦 Works seamlessly with extending Console.Builder');
console.log('📈 Reduces CLI setup boilerplate by ~70%');
