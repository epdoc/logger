import type * as Base from '../base/mod.ts';
import type { OutputFormatType } from '../types.ts';

export type StyleFormatterFn = (s: string) => string;
export type StyleFormatterMap = Record<string, StyleFormatterFn>;

/**
 * Options for configuring the `Console` transport.
 */
export interface Options extends Base.Options {
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
