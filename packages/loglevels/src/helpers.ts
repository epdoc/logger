import type { LogLevelDef } from './types.ts';

/**
 * A type guard to check if an unknown value is a valid {@link LogLevelDef}.
 *
 * @param {unknown} levelDef - The value to check.
 * @returns {boolean} `true` if the value is a `LogLevelDef` object.
 * @internal
 */
export function isLogLevelDef(levelDef: unknown): levelDef is LogLevelDef {
  return typeof levelDef === 'object' && levelDef !== null;
}
