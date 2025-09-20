import type * as Base from '../base/mod.ts';
import type { OutputFormatType } from '../types.ts';

/**
 * Options for configuring the `Console` transport.
 */
export interface ConsoleOptions extends Base.Options {
  /**
   * The output format to use.
   * @default 'text'
   */
  format?: OutputFormatType;
  /**
   * Whether to use colors in the output.
   * @default true
   */
  color?: boolean;
}
