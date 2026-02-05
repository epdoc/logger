import * as Commander from 'commander';

/**
 * Fluent builder for Commander.js options with method chaining
 *
 * Provides a clean, fluent API for building complex options with validation,
 * defaults, and parsing while maintaining the full power of Commander.js.
 *
 * @template T - The command type to return to
 *
 * @example
 * ```typescript
 * this.cmd
 *   .opt('-l --lines [num]', 'Number of lines')
 *   .default(10)
 *   .argParser(_.asInt)
 *   .done()
 *   .opt('--format <type>', 'Output format')
 *   .choices(['json', 'yaml', 'table'])
 *   .default('table')
 *   .done();
 * ```
 */
export class FluentOptionBuilder<T> {
  #command: T;
  #option: Commander.Option;

  constructor(command: T, flags: string, description: string) {
    this.#command = command;
    this.#option = new Commander.Option(flags, description);
  }

  /**
   * Restrict option to specific choices
   *
   * @param values - Array of valid values
   * @returns This builder for method chaining
   */
  choices(values: string[]): this {
    this.#option.choices(values);
    return this;
  }

  /**
   * Set default value for the option
   *
   * @param value - Default value
   * @returns This builder for method chaining
   */
  default(value: unknown): this {
    this.#option.default(value);
    return this;
  }

  /**
   * Set custom argument parser function
   *
   * @param fn - Function to parse string argument
   * @returns This builder for method chaining
   */
  argParser(fn: (value: string) => unknown): this {
    this.#option.argParser(fn);
    return this;
  }

  /**
   * Read value from environment variable
   *
   * @param name - Environment variable name
   * @returns This builder for method chaining
   */
  env(name: string): this {
    this.#option.env(name);
    return this;
  }

  /**
   * Make this option required
   *
   * @returns This builder for method chaining
   */
  required(): this {
    this.#option.makeOptionMandatory();
    return this;
  }

  /**
   * Set options that conflict with this one
   *
   * @param options - Array of conflicting option names
   * @returns This builder for method chaining
   */
  conflicts(options: string[]): this {
    this.#option.conflicts(options);
    return this;
  }

  /**
   * Hide this option from help output
   *
   * @returns This builder for method chaining
   */
  hideHelp(): this {
    this.#option.hideHelp();
    return this;
  }

  /**
   * Set preset value when flag is present but no argument given
   *
   * @param value - Preset value
   * @returns This builder for method chaining
   */
  preset(value: unknown): this {
    this.#option.preset(value);
    return this;
  }

  /**
   * Finalize the option and return to the command for continued chaining
   *
   * @returns The original command instance
   */
  emit(): T {
    // Access the commander property if it exists (BaseCommand), otherwise assume it's a Commander.Command
    const cmd = (this.#command as { commander?: Commander.Command }).commander || (this.#command as Commander.Command);
    cmd.addOption(this.#option);
    return this.#command;
  }
}
