import { _ } from '@epdoc/type';
import type { LogLevelMap, LogLevelSpec, LogLevelsSet } from './types.ts';

/**
 * Type guard to verify if an object conforms to the LogLevelSpec interface.
 */
export function isLogLevelSpec(obj: unknown, requireSeverityNumber = false): obj is LogLevelSpec {
  if (!_.isDict(obj)) return false;
  if (!_.isInteger(obj.val)) return false;

  if ((requireSeverityNumber || _.isDefined(obj.severityNumber)) && !_.isIntegerInRange(obj.severityNumber, 0, 24)) {
    return false;
  }

  // Check all optional properties
  return (
    // If severityNumber is defined (optional when not required), validate its range
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
 * @param requireSeverityNumber If true then every entry must have a severityNumber set
 * @returns
 */
export function isLogLevelMap(obj: unknown, requireSeverityNumber = false): obj is LogLevelMap {
  if (!_.isDict(obj)) return false;

  return Object.entries(obj).every(
    ([key, value]) => _.isString(key) && isLogLevelSpec(value, requireSeverityNumber),
  );
}

export function isLogLevelsSet(obj: unknown, requireSeverityNumber = false): obj is LogLevelsSet {
  return _.isDict(obj) && _.isString(obj.id) && isLogLevelMap(obj.levels, requireSeverityNumber);
}
