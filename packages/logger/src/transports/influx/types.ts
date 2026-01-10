import type * as Base from '../base/mod.ts';

/**
 * Options for configuring the InfluxDB transport.
 */
export interface Options extends Base.Options {
  host: string;
  org: string;
  bucket: string;
  token: string;
  service?: string; // Application/service name
  environment?: string; // dev, staging, prod
  hostname?: string; // Override auto-detected hostname
  batchSize?: number; // Default: 100
  flushInterval?: number; // Default: 2000ms
  maxRetries?: number; // Default: 3
  retryBaseDelay?: number; // Default: 1000ms
}

/**
 * Tracks dropped messages for summary reporting.
 */
export interface DroppedMessageStats {
  total: number;
  first: Date;
  last: Date;
  byLevel: Record<string, number>;
}
