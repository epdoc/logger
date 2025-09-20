import type { LogLevelDef } from './types.ts';

/**
 * Type guard to check if an unknown value is a valid {@link LogLevelDef}.
 * @internal
 */
export function isLogLevelDef(levelDef: unknown): levelDef is LogLevelDef {
  return typeof levelDef === 'object' && levelDef !== null;
}
