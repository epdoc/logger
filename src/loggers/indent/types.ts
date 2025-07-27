/**
 * Defines the contract for loggers that support indentation of output.
 */
export interface IIndentLogger {
  /**
   * Increases the indentation level.
   * @param {number | string} [n=1] - The number of levels to indent or a string to use as an indent.
   * @returns {this} The logger instance for chaining.
   */
  indent(n?: number | string): this;
  /**
   * Decreases the indentation level.
   * @param {number} [n=1] - The number of levels to outdent.
   * @returns {this} The logger instance for chaining.
   */
  outdent(n?: number): this;
  /**
   * Retrieves the current indentation strings.
   * @internal
   */
  getdent(): string[];
  /**
   * Resets the indentation to zero.
   * @returns {this} The logger instance for chaining.
   */
  nodent(): this;
}
