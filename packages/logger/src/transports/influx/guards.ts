import { _ } from '@epdoc/type';
import type * as Influx from './types.ts';

export function isInfluxOpts(val: unknown): val is Influx.Options {
  if (_.isDict(val) && _.isString(val.host) && _.isString(val.org) && _.isString(val.bucket) && _.isString(val.token)) {
    try {
      const url = new URL(val.host);
      const hasHttp = url.protocol.startsWith('http');
      const hasPort = url.port !== '';
      return hasHttp && hasPort;
    } catch (_e) {
      return false;
    }
  }
  return false;
}
