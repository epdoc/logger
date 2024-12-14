import { StringUtil as CoreStringUtil } from '@epdoc/string';

export class StringUtil extends CoreStringUtil {
  /** LLM generated function to count and remove tabs at the beginning of a string */
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
