import { _ } from '@epdoc/type';
import type * as LogLevel from './types.ts';

/**
 * Type guard to verify if an object conforms to the LogLevelSpec interface.
 */
export function isLogLevelSpec(obj: unknown): obj is LogLevel.LogLevelsSpec {
  if (!_.isDict(obj)) return false;
  if (!isSeverityNumber(obj.severity)) return false;

  // Check all optional properties
  return (
    (!_.isDefined(obj.fmtFn) || _.isFunction(obj.fmtFn)) &&
    (!_.isDefined(obj.icon) || _.isString(obj.icon)) &&
    ['default', 'warn', 'flush'].every(
      (prop) => !_.isDefined(obj[prop]) || _.isBoolean(obj[prop]),
    )
  );
}

/**
 * Type guard for a LogLevelMap object.
 * @param obj
 * @returns
 */
export function isLogLevelMap(obj: unknown): obj is LogLevel.LogLevelMap {
  if (!_.isDict(obj)) return false;

  return Object.entries(obj).every(
    ([key, value]) => _.isString(key) && isLogLevelSpec(value),
  );
}

export function isLogLevelsSet(obj: unknown): obj is LogLevel.LogLevelsSet {
  return _.isDict(obj) && _.isString(obj.id) && isLogLevelMap(obj.levels);
}

export function isSeverityNumber(val: unknown): val is LogLevel.Severity {
  return _.isIntegerInRange(val, 1, 24);
}

export function isSpec(val: unknown): val is LogLevel.Spec {
  return _.isDict(val) && _.isIntegerInRange(val.severity, 1, 24) && _.isString(val.name);
}
