/**
 * @file Base command class for CLI applications
 * @description Abstract base class that handles command lifecycle, context flow, and Commander.js integration
 */

import { FluentOptionBuilder } from '@epdoc/cliapp';
import { _ } from '@epdoc/type';
import { assert } from '@std/assert/assert';
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

  /**
   * The current context instance for this command.
   * Available after preAction hook runs.
   */
  public ctx!: TContext;

  /**
   * The parent command's context.
   * For root commands: set to grandparentContext in constructor.
   * For subcommands: set by setParentContext() during parent's preAction hook.
   */
  public parentContext?: TParentContext;

  /**
   * The initial context passed to the constructor.
   * Never changes after construction.
   */
  public grandpaContext?: TParentContext;

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
    this.grandpaContext = initialContext;

    // For root commands, there is no parent command to call setParentContext(),
    // so we initialize parentContext to grandparentContext here.
    // For subcommands, parentContext will be set later by setParentContext().
    if (params.root) {
      this.parentContext = this.grandpaContext;
    }

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
    if (!this.params.root && _.isNonEmptyArray(this.params.aliases)) {
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
        if (this.params.root) {
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
   *
   * **Available contexts**: `grandparentContext`, `parentContext` (root only)
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
   * Called during {@link init}. Use `this.commander` to call Commander.js methods directly,
   * or use the fluent `this.option()` / `this.argument()` helpers for cleaner chaining.
   *
   * **Available contexts**: `grandpaContext`, `parentContext` (root commands only)
   *
   * @example Using fluent helpers
   * ```typescript
   * override defineOptions() {
   *   this.option('-f, --file <path>', 'Path to input file')
   *     .default('.')
   *     .emit();
   *   this.argument('[files...]', 'Files to process').emit();
   * }
   * ```
   *
   * @example Using Commander.js directly
   * ```typescript
   * override defineOptions() {
   *   this.commander.option('--format <type>', 'Output format');
   *   this.commander.argument('[files...]', 'Files to process');
   * }
   * ```
   *
   * @see example.01.test.ts, example.02.test.ts for complete working examples
   */
  defineOptions(): void | Promise<void> {}

  /**
   * Create or select the context instance for this command.
   *
   * Called during the preAction hook. For root commands, `parent` will be `undefined` on the first
   * call (the root command's context is the one constructed before `run()`). For subcommands,
   * `parent` is the hydrated context from the parent command.
   *
   * **Common patterns:**
   * - **Reuse parent context** (most subcommands): `return parent!;`
   * - **Create a child context** (when isolation is needed): `return new ChildContext(parent!, { pkg: 'name' });`
   *
   * The default implementation returns the parent as-is, which is correct for subcommands that
   * share context with their parent.
   *
   * **Available contexts**: `grandpaContext`, `parentContext`
   *
   * @param parent - The parent command's hydrated context, or `undefined` for root commands.
   *
   * @example Reuse parent context
   * ```typescript
   * override createContext(parent?: AppContext): AppContext {
   *   return parent ?? this.parentContext!;
   * }
   * ```
   *
   * @example Create an isolated child context
   * ```typescript
   * override createContext(parent?: AppContext): ChildContext {
   *   if (!parent) throw new Error('SubCommand requires parent context');
   *   return new ChildContext(parent, { pkg: this.params.name });
   * }
   * ```
   *
   * @see example.01.test.ts for a complete example with child context isolation
   */
  createContext(parent?: TParentContext): TContext | Promise<TContext> {
    return parent as TContext;
  }

  /**
   * Apply parsed command-line options to the context.
   *
   * Called during the preAction hook immediately after {@link createContext}. Use this method to
   * transfer CLI option values onto the context so that `execute()` and any downstream subcommands
   * can read them from `ctx` instead of re-parsing the raw options.
   *
   * **Available contexts**: `grandpaContext`, `parentContext`, `ctx`
   *
   * @param _options - Parsed options for this command
   * @param _args - Positional arguments for this command
   *
   * @example
   * ```typescript
   * override hydrateContext(opts: RootOptions): void {
   *   if (opts.dryRun) this.ctx.dryRun = true;
   *   if (opts.quiet)  this.ctx.logMgr.threshold = 'error';
   * }
   * ```
   */
  hydrateContext(_options: TOpts, _args: CliApp.CmdArgs): void {}

  /**
   * Primary command logic. Override to implement what this command does.
   *
   * Called after `createContext()` and `hydrateContext()` have run. All three context properties
   * (`grandpaContext`, `parentContext`, `ctx`) are available. Access the logger via `this.ctx.log`
   * or the convenience getter `this.log`.
   *
   * The default implementation calls `this.commander.help()`, which is appropriate for root
   * commands that do nothing when invoked without a subcommand.
   *
   * **Available contexts**: `grandpaContext`, `parentContext`, `ctx`
   *
   * @param _opts - Parsed options for this command
   * @param _args - Positional arguments for this command
   *
   * @example
   * ```typescript
   * override execute(opts: ProcessOptions, args: CliApp.CmdArgs): void {
   *   this.ctx.log.info.h1('Processing').count(args.length).text('files').emit();
   *   for (const file of args) {
   *     // process each file...
   *   }
   * }
   * ```
   *
   * @see example.01.test.ts, example.02.test.ts for complete working examples
   */
  execute(_opts: TOpts, _args: CliApp.CmdArgs): void | Promise<void> {
    this.commander.help();
    return Promise.resolve();
  }

  /**
   * Override to return an array of subcommand instances.
   *
   * **Available contexts**: `grandparentContext`, `parentContext` (root only)
   */
  // See packages/cliapp/DESIGN.md
  // deno-lint-ignore no-explicit-any
  protected getSubCommands(): AbstractCommand<any, TContext>[] {
    return [];
  }

  /**
   * Returns the most recent (youngest) available context.
   *
   * Checks contexts in order: `ctx` → `parentContext` → `grandparentContext`.
   * Returns the first one that is defined, or undefined if none are available.
   *
   * Use `instanceof` to verify the context type before using it.
   *
   * @returns The youngest available context, or undefined
   */
  public activeContext(): TContext | TParentContext | undefined {
    return this.ctx ?? this.parentContext ?? this.grandpaContext;
  }

  /**
   * Retrieves the logger from the active context for use in command methods.
   */
  get log(): Ctx.Logger {
    const activeCtx = this.activeContext();
    assert(activeCtx, 'No context available for logging');
    return activeCtx.log;
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
    this.option('--log-show [show]', 'Enable log message output properties').argParser(commaList)
      .emit();
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
