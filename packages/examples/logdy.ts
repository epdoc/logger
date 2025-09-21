#!/usr/bin/env -S deno run -A

/**
 * Example demonstrating Logdy transport integration with @epdoc/logger
 * 
 * This example shows how to:
 * - Configure Logdy transport for real-time log streaming
 * - Use different logger types (CLI, STD, MIN) with Logdy
 * - Handle batching and error scenarios
 * - Stream logs to Logdy web interface
 * 
 * Prerequisites:
 * - Logdy should be running (default: http://localhost:8080)
 * - Start Logdy with: logdy serve
 */

import * as Log from '$logger';
import { LogdyTransport } from '$logdy';
import type * as MsgBuilder from '$msgbuilder';

// Create logger manager first and initialize it
const logMgr = new Log.Mgr<MsgBuilder.Console.Builder>();
logMgr.init(); // Initialize before setting threshold
logMgr.threshold = 'debug';

// Configure Logdy transport with the manager
const logdyTransport = new LogdyTransport(logMgr, {
  url: 'http://localhost:8080/api/v1/logs',
  batchSize: 10, // Smaller batch for demo
  flushInterval: 2000, // 2 seconds
  timeout: 5000,
  retryAttempts: 3,
  headers: {
    'Content-Type': 'application/json',
    // Add API key if needed: 'Authorization': 'Bearer your-api-key'
  }
});

// Add transport to manager
logMgr.addTransport(logdyTransport);

console.log('🚀 Starting Logdy transport example...');
console.log('📡 Logs will be streamed to Logdy at http://localhost:8080');
console.log('🌐 Open Logdy web interface to see real-time logs\n');

// Demonstrate different log levels
async function demonstrateLogLevels() {
  const logger = logMgr.getLogger<Log.Std.Logger<MsgBuilder.Console.Builder>>();
  
  logger.info.text('🎯 Starting log level demonstration').emit();
  
  // Basic log levels
  logger.error.text('❌ This is an error message').emit();
  logger.warn.text('⚠️ This is a warning message').emit();
  logger.info.text('ℹ️ This is an info message').emit();
  logger.debug.text('🐛 This is a debug message').emit();
  
  // Structured logging with context
  logger.info.text('📦 Processing order').value('orderId', 'ORD-12345')
    .value('customerId', 'CUST-67890')
    .value('amount', 99.99)
    .emit();
  
  // Error with details
  try {
    throw new Error('Simulated database connection error');
  } catch (error) {
    const err = error as Error;
    logger.error.text('💥 Database operation failed')
      .value('error', err.message)
      .emit();
  }
  
  // Performance logging
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
  const duration = Date.now() - startTime;
  logger.info.text('⏱️ Operation completed')
    .value('duration', `${duration}ms`)
    .value('operation', 'data-processing')
    .emit();
}

// Demonstrate different logger types
async function demonstrateLoggerTypes() {
  console.log('\n📊 Demonstrating different logger types...\n');
  
  // CLI Logger
  const cliLogMgr = new Log.Mgr<MsgBuilder.Console.Builder>();
  cliLogMgr.loggerFactory = Log.Cli.factoryMethods;
  cliLogMgr.init();
  cliLogMgr.threshold = 'debug';
  const cliTransport = new LogdyTransport(cliLogMgr, {
    url: 'http://localhost:8080/api/v1/logs',
    batchSize: 5
  });
  cliLogMgr.addTransport(cliTransport);
  
  const cliLogger = cliLogMgr.getLogger<Log.Cli.Logger<MsgBuilder.Console.Builder>>();
  cliLogger.info.text('🖥️ CLI Logger: User interface interaction')
    .value('component', 'dashboard')
    .value('action', 'view-reports')
    .emit();
  
  // STD Logger  
  const stdLogMgr = new Log.Mgr<MsgBuilder.Console.Builder>();
  stdLogMgr.loggerFactory = Log.Std.factoryMethods;
  stdLogMgr.init();
  stdLogMgr.threshold = 'debug';
  const stdTransport = new LogdyTransport(stdLogMgr, {
    url: 'http://localhost:8080/api/v1/logs',
    batchSize: 5
  });
  stdLogMgr.addTransport(stdTransport);
  
  const stdLogger = stdLogMgr.getLogger<Log.Std.Logger<MsgBuilder.Console.Builder>>();
  stdLogger.warn.text('📋 STD Logger: System resource warning')
    .value('cpu', '85%')
    .value('memory', '78%')
    .value('disk', '92%')
    .emit();
  
  // MIN Logger
  const minLogMgr = new Log.Mgr<MsgBuilder.Console.Builder>();
  minLogMgr.loggerFactory = Log.Min.factoryMethods;
  minLogMgr.init();
  minLogMgr.threshold = 'debug';
  const minTransport = new LogdyTransport(minLogMgr, {
    url: 'http://localhost:8080/api/v1/logs',
    batchSize: 5
  });
  minLogMgr.addTransport(minTransport);
  
  const minLogger = minLogMgr.getLogger<Log.Min.Logger<MsgBuilder.Console.Builder>>();
  minLogger.error.text('🔧 MIN Logger: Service unavailable')
    .value('service', 'payment-gateway')
    .value('status', 503)
    .value('retryAfter', 30)
    .emit();
}

// Demonstrate batch processing
async function demonstrateBatching() {
  console.log('\n📦 Demonstrating batch processing...\n');
  
  const logger = logMgr.getLogger<Log.Std.Logger<MsgBuilder.Console.Builder>>();
  
  // Generate multiple logs quickly to show batching
  for (let i = 1; i <= 15; i++) {
    logger.info.text(`📈 Batch log entry ${i}`)
      .value('batchId', 'BATCH-001')
      .value('sequence', i)
      .value('timestamp', new Date().toISOString())
      .emit();
    
    // Small delay to make it visible
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  logger.info.text('✅ Batch processing demonstration complete').emit();
}

// Main execution
async function main() {
  try {
    await demonstrateLogLevels();
    await demonstrateLoggerTypes();
    await demonstrateBatching();
    
    console.log('\n🎉 Example completed successfully!');
    console.log('📊 Check Logdy web interface for all logged messages');
    console.log('⏳ Waiting for final batch to flush...\n');
    
    // Wait for final flush
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('💥 Example failed:', error);
  } finally {
    // Cleanup
    await logdyTransport.close();
    console.log('🔚 Logdy transport closed');
  }
}

// Handle graceful shutdown
Deno.addSignalListener('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await logdyTransport.close();
  Deno.exit(0);
});

// Run the example
if (import.meta.main) {
  main().catch(console.error);
}
