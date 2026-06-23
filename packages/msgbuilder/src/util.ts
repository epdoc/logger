/**
 * Counts the number of tab characters at the beginning of the string.
 * @returns {number} The number of leading tab characters.
 * @example
 * ```ts
 * const s = new StringUtil('\t\tHello');
 * console.log(s.countTabsAtBeginningOfString()); // 2
 * ```
 */
export function countTabsAtBeginningOfString(s: string): number {
  let count = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\t') {
      count++;
    } else {
      break;
    }
  }
  return count;
}
