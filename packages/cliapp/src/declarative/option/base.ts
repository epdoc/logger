/**
 * @file Base option class for declarative CLI options
 * @description Abstract base class for all CLI option types, providing common functionality
 * like default values, validation, and choice constraints.
 * @module
 */

/**
 * Abstract base class for CLI command options
 * 
 * Provides the foundation for all option types in the declarative API.
 * Handles common option behaviors like default values, required validation,
 * and choice constraints. Subclasses implement specific parsing logic.
 * 
 * @template T - The parsed value type for this option
 * 
 * @example
 * ```typescript
 * // Custom option type
 * class EmailOption extends BaseOption<string> {
 *   parse(value: string): string {
 *     if (!value.includes('@')) {
 *       throw new Error('Invalid email format');
 *     }
 *     return value;
 *   }
 * }
 * 
 * // Usage with chaining
 * const emailOpt = new EmailOption('--email <address>', 'Email address')
 *   .required()
 *   .default('user@example.com');
 * ```
 */
export abstract class BaseOption<T = unknown> {
  #default?: T;
  #required = false;
  #choices?: readonly string[];

  /**
   * Creates a new option instance
   * 
   * @param flags - Commander.js style flags (e.g., '--input <file>', '-v, --verbose')
   * @param description - Human-readable description for help text
   * 
   * @example
   * ```typescript
   * new StringOption('--input <file>', 'Input file path');
   * new BooleanOption('-v, --verbose', 'Enable verbose output');
   * ```
   */
  constructor(
    public flags: string,
    public description: string,
  ) {}

  /**
   * Sets a default value for this option
   * 
   * @param value - Default value to use when option is not provided
   * @returns This option instance for method chaining
   * 
   * @example
   * ```typescript
   * new StringOption('--format <type>', 'Output format')
   *   .default('json')
   *   .choices(['json', 'csv', 'xml']);
   * ```
   */
  default(value: T): this {
    this.#default = value;
    return this;
  }

  /**
   * Marks this option as required
   * 
   * @returns This option instance for method chaining
   * 
   * @example
   * ```typescript
   * new StringOption('--api-key <key>', 'API key')
   *   .required(); // Will error if not provided
   * ```
   */
  required(): this {
    this.#required = true;
    return this;
  }

  /**
   * Restricts option values to a specific set of choices
   * 
   * @param values - Array of valid string values
   * @returns This option instance for method chaining
   * 
   * @example
   * ```typescript
   * new StringOption('--env <environment>', 'Target environment')
   *   .choices(['dev', 'staging', 'prod'])
   *   .default('dev');
   * ```
   */
  choices(values: readonly string[]): this {
    this.#choices = values;
    return this;
  }

  /**
   * Gets the default value for this option
   * 
   * @returns The default value, or undefined if none set
   */
  getDefault(): T | undefined {
    return this.#default;
  }

  /**
   * Checks if this option is required
   * 
   * @returns True if the option is required, false otherwise
   */
  isRequired(): boolean {
    return this.#required;
  }

  /**
   * Gets the valid choices for this option
   * 
   * @returns Array of valid choices, or undefined if no restrictions
   */
  getChoices(): readonly string[] | undefined {
    return this.#choices;
  }

  /**
   * Parses a string value into the option's target type
   * 
   * Abstract method that must be implemented by subclasses to handle
   * type-specific parsing logic. Should throw descriptive errors for
   * invalid input values.
   * 
   * @param value - Raw string value from command line
   * @returns Parsed value of type T
   * @throws Error when value cannot be parsed or is invalid
   * 
   * @example
   * ```typescript
   * // In a NumberOption subclass
   * parse(value: string): number {
   *   const num = parseInt(value, 10);
   *   if (isNaN(num)) {
   *     throw new Error(`Invalid number: ${value}`);
   *   }
   *   return num;
   * }
   * ```
   */
  abstract parse(value: string): T;
}
