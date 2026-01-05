/**
 * Example usage of Console transport with OTLP format
 *
 * To run with OpenTelemetry enabled:
 * OTEL_DENO=true OTEL_SERVICE_NAME=demo-service deno run logger.otlp.run.ts
 */

import type { Console } from '@epdoc/msgbuilder';
import * as Log from '../logger/src/mod.ts';

// Create log manager first
const logMgr = new Log.Mgr<Console.Builder>();
logMgr.init();

// Create console transport with OTLP format
const consoleTransport = new Log.Transport.Console.Transport(logMgr, {
  format: 'otlp', // Use OTLP format for Deno auto-export
  color: false, // No colors in structured output
});

// Add the transport to the manager
logMgr.addTransport(consoleTransport);

// Set threshold and get logger
logMgr.threshold = 'info';
const logger = logMgr.getLogger<Log.Std.Logger<Console.Builder>>();

// Example logging with structured data
logger.info.text('Service started').data({
  port: 8080,
  environment: 'development',
  config: {
    database: 'postgres',
    cache: 'redis',
  },
}).emit();

logger.warn.text('High memory usage detected').data({
  memoryUsage: 0.85,
  threshold: 0.80,
  recommendations: ['increase heap size', 'enable garbage collection'],
}).emit();

logger.error.text('Database connection failed').data({
  database: 'postgres',
  host: 'localhost',
  port: 5432,
  error: 'Connection timeout',
  retryAttempt: 3,
}).emit();

console.log('\n--- Example completed ---');
console.log('When OTEL_DENO=true, these logs are automatically exported as OTLP');
console.log('Check your OTEL collector for the structured log data');
