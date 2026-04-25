import { _ } from '@epdoc/type';
import * as colors from '@std/fmt/colors';
import * as Commander from 'commander';
import type { Logger } from './context.ts';
import type { OptionDef, OptionHelpText } from './types.ts';

const REG = {
  displayHelp: new RegExp(/^(\?|h|help)$/i),
};

/**
 * Minimal interface for commands that provide logging.
 * Satisfied by AbstractBase - allows FluentOptionBuilder to access
 * logger without knowing the full generic signature.
 */
interface ICommandWithLogger_Internal {
  readonly ctx?: {
    log: unknown;
  };
  activeContext?(): { log: unknown } | undefined;
}

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
 * // Inside defineOptions() on a command:
 * this.option('-l, --lines [num]', 'Number of lines')
 *   .default(10)
 *   .argParser(parseInt)
 *   .emit(); // registers the option and returns back to the command
 *
 * this.option('--format <type>', 'Output format')
 *   .choices(['json', 'yaml', 'table'])
 *   .default('table')
 *   .emit();
 * ```
 */
export class FluentOptionBuilder<T extends ICommandWithLogger_Internal> {
  #command: T;
  #option: Commander.Option;
  #helpText?: OptionHelpText;
  // deno-lint-ignore no-explicit-any
  #customParser?: (val: string, previous: any) => any;

  constructor(command: T, flags: OptionDef, description?: string);
  constructor(command: T, flags: string, description: string);
  constructor(command: T, flags: string | OptionDef, description?: string) {
    this.#command = command;
    if (_.isString(flags) && _.isString(description)) {
      this.#option = new Commander.Option(flags, description);
    } else if (_.isDict(flags)) {
      const def = flags as OptionDef;
      if (def.choices && def.validateChoices === false) {
        const choices: string = `(choices: ${
          def.choices.map((choice) => colors.green(typeof choice === 'string' ? choice : JSON.stringify(choice))).join(
            ', ',
          )
        })`;
        def.description = [def.description, choices].join(' ');
      }

      this.#option = new Commander.Option(FluentOptionBuilder.optionString(def), def.description);
      if (def.defVal) {
        this.#option.default(def.defVal);
      }
      if (def.help) {
        this.#helpText = def.help;
      }
      if (def.argParser) {
        this.#customParser = def.argParser;
      }
      if (def.choices && def.validateChoices !== false) {
        this.#option.choices(def.choices);
      }
    } else {
      throw new Error('Invalid flags for command');
    }
  }

  static optionString(def: OptionDef): string {
    let result = def.short ? `-${def.short}, ` : '';
    result += '--' + def.name;
    if (def.params) {
      result += ' ' + def.params;
    }
    return result;
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
  // deno-lint-ignore no-explicit-any
  argParser(fn: (value: string, previous: any) => any): this {
    this.#customParser = fn;
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
   * Add help text to display if params are set to '?'
   *
   * @param text - Help text to display
   * @returns This builder for method chaining
   */
  helpText(text: OptionHelpText): this {
    this.#helpText = text;
    return this;
  }

  /**
   * Get the help text for the option. If the option has params, the help text can be shown when the
   * param is set to "?".
   *
   * @returns The help text
   */
  getHelpText(): OptionHelpText {
    return this.#helpText;
  }

  /**
   * Attempt to get the logger from the command context.
   * Uses direct property access thanks to ICommandWithLogger constraint.
   */
  #getLogger(): Logger | undefined {
    // Direct property access - no type assertions needed!
    return (this.#command.ctx?.log as Logger | undefined) ??
      (this.#command.activeContext?.()?.log as Logger | undefined);
  }

  /**
   * Display help text for this option. Uses the logger if available,
   * otherwise falls back to console.log.
   */
  #displayHelp(): never {
    const log = this.#getLogger();

    const helpContent = _.isFunction(this.#helpText) ? this.#helpText() : this.#helpText;
    if (log) {
      log.info.h1(`Help for ${this.#option.flags}`).emit();
      log.info.plain(helpContent).emit();
    } else {
      // Fallback to console if no logger available
      console.log(`\nHelp for ${this.#option.flags}:`);
      console.log(`  ${helpContent}\n`);
    }

    Deno.exit(0);
    // Should never reach here, but satisfy TypeScript
    throw new Error('Help displayed');
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
    // Access the commander property if it exists (BaseCommand), otherwise assume it's a raw Commander.Command
    // Note: We need to cast through 'unknown' because T only guarantees ICommandWithLogger, not Commander.Command
    const cmd = (this.#command as unknown as { commander?: Commander.Command }).commander ||
      (this.#command as unknown as Commander.Command);

    if (this.#helpText) {
      // Only show hint if option accepts a parameter
      if (this.#option.flags.includes('<') || this.#option.flags.includes('[')) {
        const flagMatch = this.#option.flags.match(/--[\w-]+/);
        const flagStr = flagMatch ? flagMatch[0] : this.#option.flags.split(' ')[0];
        const helpHint = `(enter ${flagStr} ? for help)`;
        if (!this.#option.description.includes(helpHint)) {
          this.#option.description = this.#option.description ? `${this.#option.description} ${helpHint}` : helpHint;
        }
      }

      // ALWAYS set an argParser when helpText is present to intercept '?' values
      // This ensures '?' detection works even without a custom argParser
      const customParser = this.#customParser;
      // deno-lint-ignore no-explicit-any
      this.#option.argParser((val: string, previous: any) => {
        if (REG.displayHelp.test(val)) {
          this.#displayHelp();
        }
        // Call custom parser if provided, otherwise return the value as-is
        return customParser ? customParser(val, previous) : val;
      });
    } else if (this.#customParser) {
      // No help text but custom parser exists - use it directly
      this.#option.argParser(this.#customParser);
    }

    cmd.addOption(this.#option);
    return this.#command;
  }
}
