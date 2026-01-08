import { _ } from '@epdoc/type';
import type { LogLevelMap, LogLevelSpec, LogLevelsSet } from './types.ts';

/**
 * Type guard to verify if an object conforms to the LogLevelSpec interface.
 */
export function isLogLevelSpec(obj: unknown): obj is LogLevelSpec {
  if (!_.isDict(obj)) return false;
  if (!_.isInteger(obj.val)) return false;

  // Check all optional properties
  return (
    (!_.isDefined(obj.fmtFn) || _.isFunction(obj.fmtFn)) &&
    (!_.isDefined(obj.icon) || _.isString(obj.icon)) &&
    (!_.isDefined(obj.severityText) || _.isString(obj.severityText)) &&
    ['default', 'lowest', 'warn', 'flush'].every(
      (prop) => !_.isDefined(obj[prop]) || _.isBoolean(obj[prop]),
    )
  );
}

/**
 * Type guard for a LogLevelMap object.
 * @param obj
 * @returns
 */
export function isLogLevelMap(obj: unknown): obj is LogLevelMap {
  if (!_.isDict(obj)) return false;

  return Object.entries(obj).every(
    ([key, value]) => _.isString(key) && isLogLevelSpec(value),
  );
}

export function isLogLevelsSet(obj: unknown): obj is LogLevelsSet {
  return _.isDict(obj) && _.isString(obj.id) && isLogLevelMap(obj.levels);
}
