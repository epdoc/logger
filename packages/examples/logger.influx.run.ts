/**
 * Example usage of Console transport with OTLP format
 *
 * To run with OpenTelemetry enabled:
 * OTEL_DENO=true OTEL_SERVICE_NAME=demo-service deno run logger.otlp.run.ts
 */

import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';

// const otelEnabled = Deno.env.get('OTEL_DENO') === 'true';
const showOpts: Log.EmitterShowOpts = { level: true, timestamp: 'local', data: true, color: true };

// Create log manager first
const logMgr = new Log.Mgr<Console.Builder>();
logMgr.initLevels();
logMgr.show = showOpts;
logMgr.emit({ level: 'info', msg: 'Logger initialized (manual emit)', timestamp: new Date() });

const influxOpts: Log.Transport.Influx.Options = {
  host: Deno.env.get('INFLUX_HOST')!, // http://10.0.10.35:8086
  token: Deno.env.get('INFLUX_ADMIN_TOKEN')!, // xxx
  org: Deno.env.get('INFLUX_ORG')!,
  bucket: Deno.env.get('INFLUX_BUCKET_HAMON')!, // hamon
  service: 'logger-demo',
  environment: 'development',
};

// Create OTLP transport
const influxTransport = new Log.Transport.Influx.Transport(logMgr, influxOpts);
// Create console transport
const consoleTransport = new Log.Transport.Console.Transport(logMgr, {
  format: 'text',
  color: true,
});

// Add the transport to the manager
await logMgr.addTransport(influxTransport);
await logMgr.addTransport(consoleTransport);

// Set threshold and get logger
logMgr.threshold = 'info';
const logger = await logMgr.getLogger<Log.Std.Logger<Console.Builder>>();
logger.info.label('Influx Transport:').value(influxTransport).emit();
logger.info.label('Console Transport:').value(consoleTransport).emit();

// Example logging with structured data
logger.info.h2('SAMPLE:').text('Service started').data({
  port: 8080,
  environment: 'development',
  config: {
    database: 'postgres',
    cache: 'redis',
  },
}).emit();

logger.warn.h2('SAMPLE:').text('High memory usage detected').data({
  memoryUsage: 0.85,
  threshold: 0.80,
  recommendations: ['increase heap size', 'enable garbage collection'],
}).emit();

logger.error.h2('SAMPLE:').text('Database connection failed').data({
  database: 'postgres',
  host: 'localhost',
  port: 5432,
  error: 'Connection timeout',
  retryAttempt: 3,
}).emit();

console.log('\n--- Example completed ---');
console.log('Check your OTEL collector for the structured log data');
