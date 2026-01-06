/**
 * @file Advanced logger patterns
 * @description Shows advanced usage patterns like performance tracking and structured logging
 */

import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

// Example 1: Performance tracking with marks
console.log('=== Example 1: Performance Tracking ===');

const perfLogMgr = new Log.Mgr<Console.Builder>();
perfLogMgr.msgBuilderFactory = (emitter) => new Console.Builder(emitter as any);
perfLogMgr.initLevels(Log.Std.factoryMethods);
perfLogMgr.threshold = 'info';
perfLogMgr.show = {
  timestamp: 'elapsed',
};
const perfLogger = await perfLogMgr.getLogger<Log.Std.Logger<Console.Builder>>();

const mark = perfLogger.mark();
perfLogger.info.text('Starting operation...').emit();

// Simulate some work
await new Promise((resolve) => setTimeout(resolve, 100));

perfLogger.info.text('Operation completed').ewt(mark); // Shows elapsed time

// Example 2: Structured logging with labels and values
console.log('\n=== Example 2: Structured Logging ===');

const structuredLogger = await perfLogMgr.getLogger<Log.Std.Logger<Console.Builder>>();

structuredLogger.info.h1('User Registration')
  .label('Email:').value('user@example.com')
  .label('Role:').value('admin')
  .label('Status:').value('active')
  .emit();

// Example 3: Request tracking
console.log('\n=== Example 3: Request Tracking ===');

class RequestBuilder extends Console.Builder {
  constructor(emitter: Log.IEmitter) {
    super(emitter as any);
  }

  request(method: string, path: string, status: number) {
    const statusText = status < 400 ? '✓' : status < 500 ? '⚠' : '✗';
    return this.text('[REQ] ').text(method).text(' ').text(path)
      .text(' → ').text(status.toString()).text(' ').text(statusText);
  }

  database(query: string, duration: number) {
    return this.text('[DB] ').text(query).text(' ')
      .text(`(${duration}ms)`);
  }
}

type Logger = Log.Std.Logger<RequestBuilder>;

const requestLogMgr = new Log.Mgr<RequestBuilder>();
requestLogMgr.msgBuilderFactory = (emitter) => new RequestBuilder(emitter as any);
requestLogMgr.initLevels(Log.Std.factoryMethods);
requestLogMgr.threshold = 'info';
const requestLogger = await requestLogMgr.getLogger<Logger>();

// Simulate request logging
requestLogger.info.request('GET', '/api/users', 200).emit();
requestLogger.info.database('SELECT * FROM users', 45).emit();
requestLogger.warn.request('POST', '/api/login', 401).emit();

// Example 4: Different threshold levels in action
console.log('\n=== Example 4: Threshold Levels ===');

const thresholdLogMgr = new Log.Mgr<Console.Builder>();
thresholdLogMgr.msgBuilderFactory = (emitter) => new Console.Builder(emitter as any);
thresholdLogMgr.initLevels(Log.Std.factoryMethods);
thresholdLogMgr.threshold = 'warn';
thresholdLogMgr.show = {
  level: true,
};
const thresholdLogger = await thresholdLogMgr.getLogger<Log.Std.Logger<Console.Builder>>();

thresholdLogger.debug.text('Debug message (hidden)').emit();
thresholdLogger.info.text('Info message (hidden)').emit();
thresholdLogger.warn.text('Warning message (visible)').emit();
thresholdLogger.error.text('Error message (visible)').emit();

// Example 5: Package and request ID tracking
console.log('\n=== Example 5: Context Tracking ===');

const contextLogMgr = new Log.Mgr<Console.Builder>();
contextLogMgr.msgBuilderFactory = (emitter) => new Console.Builder(emitter as any);
contextLogMgr.initLevels(Log.Std.factoryMethods);
contextLogMgr.threshold = 'info';
contextLogMgr.show = {
  level: true,
};

const contextLogger = await contextLogMgr.getLogger<Log.Std.Logger<Console.Builder>>();
contextLogger.reqId = 'req-67890';
contextLogger.pkgs.push('user-service');

contextLogger.info.text('Message with context tracking').emit();

console.log('\n=== Summary ===');
console.log('⏱️  Use .mark() and .ewt() for performance tracking');
console.log('🏷️  Structure logs with .label() and .value()');
console.log('🎯 Create domain-specific builders for consistent logging');
console.log('📊 Use threshold levels to control log verbosity');
console.log('🔍 Track requests and packages for debugging');
