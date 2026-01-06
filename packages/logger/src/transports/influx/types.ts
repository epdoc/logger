import type * as Base from '../base/mod.ts';

/**
 * Options for configuring the `Console` transport.
 */
export interface Options extends Base.Options {
  host: string;
  org: string;
  bucket: string;
  token: string;
}
