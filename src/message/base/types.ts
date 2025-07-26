import type { Integer } from '@epdoc/type';
import type { Entry } from '../../types.ts';
import type { StyleArg } from '../types.ts';

/**
 * Interface for a basic message builder.
 */
export interface IBuilder {
  /**
   * Clears the message content.
   * @returns {this} The current instance for method chaining.
   */
  clear(): this;
  /**
   * Sets the initial string content of the message.
   * @param {...StyleArg[]} args - The arguments to set as the initial string.
   * @returns {this} The current instance for method chaining.
   */
  setInitialString(...args: StyleArg[]): this;
  /**
   * Indents the message by a specified number of spaces or with a custom string.
   * @param {Integer | string} n - The number of spaces or the string to use for indentation.
   * @returns {this} The current instance for method chaining.
   */
  indent(n: Integer | string): this;
  /**
   * Adds a tab to the message.
   * @param {Integer} n - The number of tabs to add.
   * @returns {this} The current instance for method chaining.
   */
  tab(n: Integer): this;
  /**
   * Appends a comment to the message.
   * @param {...string[]} args - The comment strings to append.
   * @returns {this} The current instance for method chaining.
   */
  comment(...args: string[]): this;
  /**
   * Appends structured data to the message.
   * @param {Record<string, unknown>} data - The data to append.
   * @returns {this} The current instance for method chaining.
   */
  data(data: Record<string, unknown>): this;
  /**
   * Emits the log entry.
   * @returns {Entry | undefined} The emitted log entry, or `undefined` if not emitted.
   */
  emit(): Entry | undefined;
}
