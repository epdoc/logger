/**
 * @file Base command class for CLI applications
 * @description Abstract base class that handles command lifecycle, context flow, and Commander.js integration
 */

import { FluentOptionBuilder } from '@epdoc/cliapp';
import { _ } from '@epdoc/type';
import * as Commander from 'commander';
import { FluentArgumentBuilder } from '../argument.ts';
import { config } from '../config.ts';
import type * as Ctx from '../context.ts';
import type * as CliApp from '../types.ts';
import { commaList, configureLogging } from '../utils.ts';

/**
 * Abstract base class for creating CLI commands with automatic context flow
 *
 * Provides lifecycle management, context inheritance, and Commander.js integration.
 *
 * ### Command Lifecycle
 * 1. **constructor**: Sets up basic Commander.js state and stores parameters.
 * 2. **init()**: (Async) Configures metadata, options, and subcommands.
 * 3. **CliApp.run()**: The entry point that initializes the tree and parses the CLI.
 * 4. **preAction Hook**: Internal hook that creates and hydrates the context.
 * 5. **execute()**: Performs the primary command logic.
 *
 * @template TContext - The context type for this command
 * @template TParentContext - The parent context type (defaults to TContext)
 * @template TOpts - The options type for this command
 */
export abstract class AbstractCommand<
  TContext extends TParentContext,
  TParentContext extends Ctx.AbstractBase,
  TOpts extends CliApp.CmdOptions = CliApp.CmdOptions,
> {
  /** The underlying Commander.js Command instance */
  public commander: Commander.Command;

  /** The current context instance (available after preAction hook) */
  protected ctx!: TContext;

  /** The parent context passed during construction */
  protected parentContext?: TParentContext;

  /** Command parameters stored from constructor */
  protected params: CliApp.CmdParams;

  /** Whether the command has been initialized */
  protected initialized = false;

  // See packages/cliapp/DESIGN.md
  // deno-lint-ignore no-explicit-any
  #subCommands?: AbstractCommand<any, TContext>[];

  /**
   * Initializes basic Commander.js state and stores constructor parameters.
   *
   * @param initialContext - Optional initial context for root commands.
   * @param params - Configuration parameters.
   * @param params.name - Command name.
   * @param params.description - Brief command summary.
   * @param params.version - Version string (only applied if root=true).
   * @param params.aliases - Command aliases (only for subcommands).
   * @param params.root - Set to true for the root command to enable global flags.
   * @param params.dryRun - Set to true to include the global --dry-run option.
   */
  constructor(
    initialContext?: TParentContext,
    params: CliApp.CmdParams = {},
  ) {
    this.params = params;
    this.commander = new Commander.Command(params.name);
    this.parentContext = initialContext;

    // Configure help and output formatting
    this.commander.configureHelp(config.help);
    this.commander.configureOutput(config.output);
  }

  /**
   * Performs asynchronous command initialization.
   *
   * This method applies metadata (name, description, version, aliases),
   * sets up command options via {@link defineOptions}, and recursively
   * initializes subcommands.
   *
   * Metadata provided in the constructor {@link params} (or via the
   * declarative {@link createCommand} `node`) takes precedence over values
   * set programmatically in {@link defineMetadata}.
   *
   * @returns A promise that resolves to the command instance.
   */
  public async init(): Promise<this> {
    if (this.initialized) return this;
    this.initialized = true;

    // Subclasses can apply additional metadata here FIRST
    await this.defineMetadata();

    // THEN apply constructor params (which override defineMetadata)
    if (this.params.name) {
      this.commander.name(this.params.name);
    }
    if (this.params.root && this.params.version) {
      this.commander.version(this.params.version);
    }
    if (this.params.description) {
      this.commander.description(this.params.description);
    }
    if (!this.params.aliases && _.isNonEmptyArray(this.params.aliases)) {
      this.commander.aliases(this.params.aliases);
    }

    // Subclasses define their CLI interface here
    await this.defineOptions();

    // Register and initialize subcommands
    await this.registerSubCommands();

    // Add logging options for root commands
    if (this.params.root) {
      this.#addLoggingOptions();
    }

    // The middleware chain - runs after parsing, before action
    this.commander.hook(
      'preAction',
      async (
        _thisCommand: Commander.Command,
        _actionCommand: Commander.Command,
      ) => {
        // 1. Create the context instance for this specific level
        this.ctx = await this.createContext(this.parentContext);

        // 2. Hydrate context using parsed options for this command
        const opts = this.commander.opts() as TOpts;
        const args = this.commander.args as CliApp.CmdArgs;
        this.hydrateContext(opts, args);

        // 3. Configure logging for root commands
        if (
          'logLevel' in opts || 'verbose' in opts || 'debug' in opts ||
          'trace' in opts || 'spam' in opts ||
          'logShow' in opts || 'logShowAll' in opts || 'color' in opts
        ) {
          configureLogging(this.ctx, opts as CliApp.LogOptions);
        }

        // 4. Pass this context down to subcommands so they can inherit
        const subCommands = this.#getCachedSubCommands();
        subCommands.forEach((sub) => {
          sub.setParentContext(this.ctx);
        });
      },
    );

    // Final execution handler
    this.commander.action(async (...params: unknown[]) => {
      const opts = params[params.length - 2] as TOpts;
      const rawArgs = params.slice(0, -2);
      const args = (rawArgs.length === 1 && Array.isArray(rawArgs[0])) ? rawArgs[0] as string[] : rawArgs as string[];
      await this.execute(opts, args);
    });

    return this;
  }

  /**
   * Override to define additional command metadata.
   *
   * Called during {@link init}. Values set here may be overridden by
   * constructor {@link params}.
   */
  defineMetadata(): void | Promise<void> {}

  set description(val: string) {
    this.params.description = val;
  }
  set name(val: string) {
    this.params.name = val;
  }
  set aliases(val: string | string[]) {
    this.params.aliases = _.isArray(val) ? val : [val];
  }

  /**
   * Override to define command-specific options and arguments.
   *
   * Called during {@link init} using the {@link commander} instance.
   *
   * @example
   * ```typescript
   * override async defineOptions() {
   *   this.option('-f, --file <path>', 'Path to file').default(".").emit();
   * }
   * ```
   */
  defineOptions(): void | Promise<void> {}

  /**
   * Create a context instance for this command level.
   *
   * Called during the preAction hook. For root commands, `parent` will be
   * undefined. Subcommands receive the hydrated parent context.
   *
   * @param parent - The parent context instance.
   */
  createContext(parent?: TParentContext): TContext | Promise<TContext> {
    return parent as TContext;
  }

  /**
   * Update the context with parsed command-line options.
   *
   * Called during the preAction hook after {@link createContext}.
   */
  hydrateContext(_options: TOpts, _args: CliApp.CmdArgs): void {}

  /**
   * Primary command logic implementation.
   */
  execute(_opts: TOpts, _args: CliApp.CmdArgs): void | Promise<void> {
    this.commander.help();
    return Promise.resolve();
  }

  /**
   * Override to return an array of subcommand instances.
   */
  // See packages/cliapp/DESIGN.md
  // deno-lint-ignore no-explicit-any
  protected getSubCommands(): AbstractCommand<any, TContext>[] {
    return [];
  }

  // --- Internal Wiring ---

  public setParentContext(ctx: TParentContext) {
    this.parentContext = ctx;
  }

  // See packages/cliapp/DESIGN.md
  // deno-lint-ignore no-explicit-any
  #getCachedSubCommands(): AbstractCommand<any, TContext>[] {
    if (!this.#subCommands) {
      this.#subCommands = this.getSubCommands();
    }
    return this.#subCommands;
  }

  /**
   * Registers and initializes all declared subcommands.
   * @internal
   */
  public async registerSubCommands(): Promise<void> {
    const subCommands = this.#getCachedSubCommands();
    for (const sub of subCommands) {
      // Recursive initialization
      await sub.init();
      this.commander.addCommand(sub.commander);
    }
  }

  option(flags: string, description: string): FluentOptionBuilder<this> {
    return new FluentOptionBuilder(this, flags, description);
  }

  argument(flags: string, description: string): FluentArgumentBuilder<this> {
    return new FluentArgumentBuilder(this, flags, description);
  }

  #addLoggingOptions(): void {
    this.option('--log-level <level>', 'Set the threshold log output level.')
      .choices([
        'FATAL',
        'CRITICAL',
        'ERROR',
        'WARN',
        'INFO',
        'VERBOSE',
        'DEBUG',
        'TRACE',
        'SPAM',
        'SILLY',
      ])
      .argParser((val) => val.toUpperCase()).emit();
    this.option('--verbose', 'Shortcut for --log verbose').emit();
    this.option('-D, --debug', 'Shortcut for --log debug').emit();
    this.option('-T, --trace', 'Shortcut for --log trace').emit();
    this.option('-S, --spam', 'Shortcut for --log spam').emit();
    this.option('--log-show [show]', 'Enable log message output properties')
      .default('level').argParser(commaList).emit();
    this.option('-A, --log-show-all', 'Shortcut for --log_show all').emit();
    this.option('--no-color', 'Do not show color in output').emit();

    if (this.params.dryRun) {
      this.option('-n, --dry-run', 'Perform a dry run without making changes')
        .emit();
    }
  }

  /**
   * Add custom help text to the command.
   *
   * @param text - The help text to add
   * @param position - Position of the text relative to the help output (default: 'after')
   */
  public addHelpText(
    text: string,
    position: CliApp.AddHelpTextPosition = 'after',
  ): this {
    this.commander.addHelpText(position, text);
    return this;
  }
}
