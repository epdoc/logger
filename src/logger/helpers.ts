import type { IMark } from './types.ts';

/**
 * Type guard to check if an object implements the {@link IMark} interface.
 * @param {object} val - The object to check.
 * @returns {boolean} `true` if the object has a `mark` method.
 * @internal
 */
export function isIMark(val: object): val is IMark {
  return (<IMark> val).mark !== undefined;
}
