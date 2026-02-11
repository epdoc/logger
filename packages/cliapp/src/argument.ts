import * as Commander from 'commander';

/**
 * Fluent builder for Commander.js arguments with method chaining
 *
 * Provides a fluent API for building arguments with validation,
 * defaults, and parsing while maintaining the full power of Commander.js.
 *
 * @template T - The command type to return to
 *
 * @example
 * ```typescript
 * this.cmd
 *   .argument('-l --lines [num]', 'Number of lines')
 *   .default(10)
 *   .argParser(_.asInt)
 *   .emit()
 * ```
 */

export class FluentArgumentBuilder<T> {
  #command: T;
  #argument: Commander.Argument;

  constructor(command: T, name: string, description: string) {
    this.#command = command;
    // We instantiate the internal Argument object immediately
    this.#argument = new Commander.Argument(name, description);
  }

  /**
   * Set the default value for the argument.
   */
  default(value: unknown, description?: string): this {
    this.#argument.default(value, description);
    return this;
  }

  /**
   * Add a custom processing function (parser).
   */
  argParser<V>(fn: (value: string, previous: V) => V): this {
    this.#argument.argParser(fn);
    return this;
  }

  /**
   * Restrict the argument to a specific set of choices.
   */
  choices(values: string[]): this {
    this.#argument.choices(values);
    return this;
  }

  /**
   * Make the argument mandatory (usually inferred from <name>).
   */
  required(): this {
    this.#argument.argRequired();
    return this;
  }

  /**
   * Make the argument optional (usually inferred from [name]).
   */
  optional(): this {
    this.#argument.argOptional();
    return this;
  }

  /**
   * Finalizes the argument definition and returns the original Command.
   * This is the "bridge" back to your command definition flow.
   */
  emit(): T {
    // Access the commander property if it exists (BaseCommand), otherwise assume it's a Commander.Command
    const cmd = (this.#command as { commander?: Commander.Command }).commander ||
      (this.#command as Commander.Command);
    cmd.addArgument(this.#argument);
    return this.#command;
  }
}
