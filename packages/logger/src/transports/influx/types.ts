import type * as Base from '../base/mod.ts';

/**
 * Options for configuring the InfluxDB transport.
 */
export interface Options extends Base.Options {
  host: string;
  org: string;
  bucket: string;
  token: string;
  service?: string;      // Application/service name
  environment?: string;  // dev, staging, prod
  hostname?: string;     // Override auto-detected hostname
}
