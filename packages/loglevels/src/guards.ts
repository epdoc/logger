import { _ } from '@epdoc/type';
import type { LogLevelDef } from './types.ts';

/**
 * Type guard to verify if an object conforms to the LogLevelDef interface.
 */
export function isLogLevelDef(obj: unknown): obj is LogLevelDef {
  if (!_.isDict(obj)) return false;

  // Check required property
  if (!_.isInteger(obj.val)) return false;

  // Check all optional properties
  return (
    (!_.isDefined(obj.severityNumber) || _.isIntegerInRange(obj.severityNumber, 0, 24)) &&
    (!_.isDefined(obj.fmtFn) || _.isFunction(obj.fmtFn)) &&
    (!_.isDefined(obj.icon) || _.isString(obj.icon)) &&
    ['default', 'lowest', 'warn', 'flush'].every(
      (prop) => !_.isDefined(obj[prop]) || _.isBoolean(obj[prop]),
    )
  );
}
