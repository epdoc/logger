import { StringUtil as CoreStringUtil } from '@epdoc/string';

/**
 * A utility class for string manipulation, extending `CoreStringUtil`.
 */
export class StringUtil extends CoreStringUtil {
  /**
   * Counts the number of tab characters at the beginning of the string.
   * @returns {number} The number of leading tab characters.
   * @example
   * ```ts
   * const s = new StringUtil('\t\tHello');
   * console.log(s.countTabsAtBeginningOfString()); // 2
   * ```
   */
  countTabsAtBeginningOfString(): number {
    let count = 0;
    for (let i = 0; i < this._str.length; i++) {
      if (this._str[i] === '\t') {
        count++;
      } else {
        break;
      }
    }
    return count;
  }
}
