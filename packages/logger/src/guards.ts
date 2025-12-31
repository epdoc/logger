import { _ } from '@epdoc/type';
import { isTimestampFormat } from './consts.ts';
import type { EmitterShowOpts } from './types.ts';

/**
 * Strict type guard to check if a value is a valid {@link EmitterShowOpts}.
 * Rejects objects with any unknown properties.
 *
 * @param {unknown} val - The value to check.
 * @returns {boolean} `true` if the value is a valid EmitterShowOpts with no extra properties.
 * @internal
 */
export function isStrictEmitterShowOpts(val: unknown): val is EmitterShowOpts {
  const allowedPropertyNames = [
    'level',
    'timestamp',
    'sid',
    'reqId',
    'pkg',
    'data',
    'time',
    'pkgSep',
    'color',
  ] as const;

  if (!_.isDict(val) || !_.hasOnlyAllowedProperties(val, allowedPropertyNames)) {
    return false;
  }

  const obj = val as Record<string, unknown>;

  // Direct one-liners for each property
  if (
    'level' in obj &&
    !(_.isUndefined(obj.level) || _.isBoolean(obj.level) || _.isInteger(obj.level) || obj.level === 'icon')
  ) return false;
  if ('sid' in obj && !(_.isUndefined(obj.sid) || _.isBoolean(obj.sid))) return false;
  if ('timestamp' in obj && !(_.isUndefined(obj.timestamp) || isTimestampFormat(obj.timestamp))) return false;
  if ('reqId' in obj && !(_.isUndefined(obj.reqId) || _.isBoolean(obj.reqId) || _.isInteger(obj.reqId))) return false;
  if ('pkg' in obj && !(_.isUndefined(obj.pkg) || _.isBoolean(obj.pkg) || _.isInteger(obj.pkg))) return false;
  if ('data' in obj && !(_.isUndefined(obj.data) || _.isBoolean(obj.data))) return false;
  if ('time' in obj && !(_.isUndefined(obj.time) || _.isBoolean(obj.time))) return false;
  if ('pkgSep' in obj && !(_.isUndefined(obj.pkgSep) || _.isString(obj.pkgSep))) return false;
  if ('color' in obj && !(_.isUndefined(obj.color) || _.isBoolean(obj.color))) return false;

  return true;
}
