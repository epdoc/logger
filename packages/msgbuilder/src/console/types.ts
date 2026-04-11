import type * as MsgBuilder from '../types.ts';
import type { StyleFormatterFn } from '../types.ts';

/**
 * The complete set of style keys required by {@link ConsoleMsgBuilder} methods.
 *
 * Every {@link ConsoleStyleMap} must define all of these keys. Additional keys
 * are allowed and can be accessed via {@link ConsoleMsgBuilder.styles} in
 * subclasses.
 */
export type ConsoleStyleKey =
  | 'text'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'action'
  | 'label'
  | 'highlight'
  | 'value'
  | 'path'
  | 'url'
  | 'date'
  | 'code'
  | 'warn'
  | 'error'
  | 'success'
  | 'strikethru'
  | 'dim'
  | 'bold';

/**
 * A style map that satisfies all keys required by {@link ConsoleMsgBuilder}.
 *
 * The intersection with `Record<string, StyleFormatterFn>` allows extra keys
 * (e.g. custom theme additions) while the `Record<ConsoleStyleKey, ...>` part
 * ensures that all required keys are present at compile time.
 */
export type ConsoleStyleMap = Record<ConsoleStyleKey, StyleFormatterFn> & Record<string, StyleFormatterFn>;

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
   * Appends a path-styled message. Use for displaying file paths or filenames.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  path(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a URL-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  url(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a path relative to the home directory.
   * @param {string} path - The path to be made relative.
   * @returns {this} The current instance for method chaining.
   */
  relative(path: string, relativeTo?: string): this;
  /**
   * Appends a date-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  date(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a code-styled message. Use for inline code snippets.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  code(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a section divider with an optional title.
   * @param {string} [str] - The title of the section.
   * @returns {this} The current instance for method chaining.
   */
  section(str?: string): this;
  /**
   * Appends a formatted error message.
   * @param {unknown} error - The error to be formatted.
   * @param {IConsoleErrOpts} [opts] - Options for formatting the error.
   * @returns {this} The current instance for method chaining.
   */
  err(error: unknown, opts?: IConsoleErrOpts): this;
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
   * Appends a success-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  success(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Appends a strikethrough-styled message.
   * @param {...MsgBuilder.StyleArg[]} args - The arguments to be styled.
   * @returns {this} The current instance for method chaining.
   */
  strikethru(...args: MsgBuilder.StyleArg[]): this;
  /**
   * Dim mode control or dim styling.
   *
   * - `dim()`: Toggle persistent dim mode (on↔off)
   * - `dim(true)`: Enable persistent dim mode for all subsequent output
   * - `dim(false)`: Disable persistent dim mode
   * - `dim('text')` or `dim(value, ...)`: Apply dim styling to text only (one-time)
   *
   * @param {boolean | MsgBuilder.StyleArg} firstArg - Toggle/enable/disable flag or text to style
   * @param {...MsgBuilder.StyleArg[]} restArgs - Additional text arguments (when styling)
   * @returns {this} The current instance for method chaining.
   */
  dim(firstArg?: boolean | MsgBuilder.StyleArg, ...restArgs: MsgBuilder.StyleArg[]): this;
  /**
   * Disable persistent dim mode.
   * Alias for `dim(false)`.
   *
   * @returns {this} The current instance for method chaining.
   */
  undim(): this;
  /**
   * Bold mode control or bold styling.
   *
   * - `bold()`: Toggle persistent bold mode (on↔off)
   * - `bold(true)`: Enable persistent bold mode for all subsequent output
   * - `bold(false)`: Disable persistent bold mode
   * - `bold('text')` or `bold(value, ...)`: Apply bold styling to text only (one-time)
   *
   * @param {boolean | MsgBuilder.StyleArg} firstArg - Toggle/enable/disable flag or text to style
   * @param {...MsgBuilder.StyleArg[]} restArgs - Additional text arguments (when styling)
   * @returns {this} The current instance for method chaining.
   */
  bold(firstArg?: boolean | MsgBuilder.StyleArg, ...restArgs: MsgBuilder.StyleArg[]): this;
  /**
   * Disable persistent bold mode.
   * Alias for `bold(false)`.
   *
   * @returns {this} The current instance for method chaining.
   */
  unbold(): this;
  /**
   * Appends a green checkmark icon (✓). Defaults to `success` style.
   * @param {StyleFormatterFn} [color] - Optional style override.
   * @returns {this} The current instance for method chaining.
   */
  icheck(color?: StyleFormatterFn): this;
  /**
   * Appends a yellow warning icon (⚠). Defaults to `warn` style.
   * @param {StyleFormatterFn} [color] - Optional style override.
   * @returns {this} The current instance for method chaining.
   */
  ialert(color?: StyleFormatterFn): this;
  /**
   * Appends a red cross icon (✗). Defaults to `error` style.
   * @param {StyleFormatterFn} [color] - Optional style override.
   * @returns {this} The current instance for method chaining.
   */
  ierror(color?: StyleFormatterFn): this;
  /**
   * Appends a right arrow icon (→). Defaults to `value` style.
   * @param {StyleFormatterFn} [color] - Optional style override.
   * @returns {this} The current instance for method chaining.
   */
  iarrow(color?: StyleFormatterFn): this;
  /**
   * Appends a star icon (★). Defaults to `highlight` style.
   * @param {StyleFormatterFn} [color] - Optional style override.
   * @returns {this} The current instance for method chaining.
   */
  istar(color?: StyleFormatterFn): this;
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
