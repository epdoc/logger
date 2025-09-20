import type * as MsgBuilder from '../types.ts';

/**
 * Interface for a console message builder that provides methods for styling
 * log messages.
 */
export interface IConsoleMsgBuilder {
  /**
   * Appends styled text to the message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  text(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a top-level heading (h1) to the message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  h1(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a secondary heading (h2) to the message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  h2(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a tertiary heading (h3) to the message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  h3(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends an action-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  action(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a label-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  label(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a highlighted message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  highlight(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a value-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  value(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a path-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  path(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a path relative to the home directory.
   * @param {string} path - The path to be made relative.
   * @returns {this} The current instance for method chaining.
   */
  relative(path: string): this;
  /**
   * Appends a date-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  date(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a section divider with an optional title.
   * @param {string} str - The title of the section.
   * @returns {this} The current instance for method chaining.
   */
  section(str: string): this;
  /**
   * Appends a formatted error message.
   * @param {unknown} error - The error to be formatted.
   * @param {ConsoleErrOpts} opts - Options for formatting the error.
   * @returns {this} The current instance for method chaining.
   */
  err(error: unknown, opts: IConsoleErrOpts): this;
  /**
   * Appends a warning-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  warn(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends an error-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  error(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a strikethrough-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  strikethru(...args: MsgBuilder.StyleArg[]): this;
}

/**
 * Options for formatting an error message.
 */
export interface IConsoleErrOpts {
  /**
   * Whether to include the error code.
   * @default false
   */
  code?: boolean;
  /**
   * Whether to include the error cause.
   * @default true
   */
  cause?: boolean;
  /**
   * Whether to include the error path.
   * @default true
   */
  path?: boolean;
  /**
   * Whether to include the stack trace.
   * @default false
   */
  stack?: boolean;
}
