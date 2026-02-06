/**
 * @file Base command class for CLI applications
 * @description Abstract base class that handles command lifecycle, context flow, and Commander.js integration
 */

import * as Commander from 'commander';
import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import type * as Ctx from './context.ts';
import type * as CliApp from './types.ts';
import { config } from './config.ts';
import { configureLogging } from './utils.ts';

/**
 * Abstract base class for creating CLI commands with automatic context flow
 *
 * Provides lifecycle management, context inheritance, and Commander.js integration.
 * Extend this class and implement the abstract methods to create commands.
 *
 * @template TContext - The context type for this command
 * @template TParentContext - The parent context type (defaults to TContext)
 * @template TOpts - The options type for this command
 *
 * @example
 * ```typescript
 * class MyCommand extends BaseCommand<MyContext, ParentContext, MyOptions> {
 *   defineMetadata() {
 *     this.commander.name('mycommand');
 *     this.commander.description('My command description');
 *   }
 *
 *   defineOptions() {
 *     this.commander.option('--my-option', 'My option description');
 *   }
 *
 *   createContext(parent?) {
 *     return new MyContext(parent);
 *   }
 *
 *   hydrateContext(options) {
 *     this.ctx.myValue = options.myOption;
 *   }
 *
 *   execute(opts, args) {
 *     this.ctx.log.info.text('Executing').emit();
 *   }
 * }
 * ```
 */
export abstract class BaseCommand<
  TContext extends TParentContext,
  TParentContext extends Ctx.ICtx<any, any> = Ctx.ICtx,
  TOpts extends CliApp.CmdOptions = CliApp.CmdOptions,
> {
  /** The underlying Commander.js Command instance */
  public commander: Commander.Command;

  /** The current context instance (available after preAction hook) */
  protected ctx!: TContext;

  /** The parent context passed during construction */
  protected parentContext?: TParentContext;

  #subCommands?: BaseCommand<TContext, TContext>[];

  /**
   * Create a new command instance
   *
   * @param name - Optional command name
   * @param initialContext - Optional initial context for root commands
   * @param isRoot - Whether this is a root command (required for root commands to get logging options)
   * @param addDryRun - Whether to add --dry-run option (only for root commands)
   */
  constructor(name?: string, initialContext?: TParentContext, isRoot = false, addDryRun = false) {
    this.commander = new Commander.Command(name);
    this.parentContext = initialContext;

    // Configure help and output formatting
    this.commander.configureHelp(config.help);
    this.commander.configureOutput(config.output);

    this.defineMetadata();
    this.defineOptions();

    // Register subcommands early so they're available for parsing
    this.registerSubCommands();

    // Add logging options for root commands
    if (isRoot) {
      this.#addLoggingOptions();
      if (addDryRun) {
        this.commander.option('--dry-run', 'Perform a dry run without making changes');
      }
    }

    // The middleware chain - runs after parsing, before action
    this.commander.hook('preAction', (_thisCommand: Commander.Command, _actionCommand: Commander.Command) => {
      // 1. Create the context instance for this specific level
      this.ctx = this.createContext(this.parentContext);

      // 2. Hydrate context using parsed options for this command
      const opts = this.commander.opts() as TOpts;
      this.hydrateContext(opts);

      // 3. Configure logging for root commands (check if we have logging options)
      if ('logLevel' in opts || 'verbose' in opts || 'debug' in opts) {
        configureLogging(this.ctx, opts as CliApp.LogOptions);
      }

      // 4. Pass this context down to subcommands so they can inherit
      const subCommands = this.#getCachedSubCommands();
      subCommands.forEach((sub) => {
        sub.setParentContext(this.ctx);
      });
    });

    // Final execution
    this.commander.action(async (...params: unknown[]) => {
      // Commander.js passes: ...args, options, command
      // For variadic args like <files...>, they come as a single array parameter
      // We want: options, args (flattened)
      const opts = params[params.length - 2] as TOpts;
      const rawArgs = params.slice(0, -2);
      // Flatten if first arg is an array (variadic argument)
      const args = (rawArgs.length === 1 && Array.isArray(rawArgs[0])) ? rawArgs[0] as string[] : rawArgs as string[];
      await this.execute(opts, args);
    });
  }

  // --- Abstract methods to be implemented by subclasses ---

  /**
   * Define command metadata (name, description, version, aliases)
   *
   * Called during construction to set up the command's basic information.
   *
   * @example
   * ```typescript
   * defineMetadata() {
   *   this.commander.name('mycommand');
   *   this.commander.description('Does something useful');
   *   this.commander.version('1.0.0');
   * }
   * ```
   */
  abstract defineMetadata(): void;

  /**
   * Define command options and arguments
   *
   * Called during construction to set up the command's CLI interface.
   *
   * @example
   * ```typescript
   * defineOptions() {
   *   this.commander.option('--force', 'Force the operation');
   *   this.commander.argument('<file>', 'File to process');
   * }
   * ```
   */
  abstract defineOptions(): void;

  /**
   * Create a context instance for this command
   *
   * Called during the preAction hook to create the context.
   * For root commands, parent will be undefined - use initialContext.
   * For subcommands, parent will be the hydrated parent context.
   *
   * @param parent - The parent context (undefined for root commands)
   * @returns The context instance for this command
   *
   * @example
   * ```typescript
   * createContext(parent?) {
   *   if (!parent) return this.parentContext!; // Root
   *   return new ChildContext(parent); // Child
   * }
   * ```
   */
  abstract createContext(parent?: TParentContext): TContext;

  /**
   * Hydrate the context with parsed command-line options
   *
   * Called during the preAction hook after createContext.
   * Use this to populate context properties from parsed options.
   *
   * @param options - The parsed command-line options
   *
   * @example
   * ```typescript
   * hydrateContext(options) {
   *   this.ctx.apiUrl = options.apiUrl;
   *   this.ctx.verbose = options.verbose;
   * }
   * ```
   */
  abstract hydrateContext(options: TOpts): void;

  /**
   * Execute the command with parsed options and arguments
   *
   * Called when the command is invoked. Implement your command logic here.
   * The context is fully initialized and hydrated at this point.
   *
   * @param opts - The parsed command-line options
   * @param args - The parsed command-line arguments
   *
   * @example
   * ```typescript
   * execute(opts, args) {
   *   this.ctx.log.info.text(`Processing ${args.length} files`).emit();
   *   if (opts.force) {
   *     // Force processing
   *   }
   * }
   * ```
   */
  abstract execute(opts: TOpts, args: CliApp.CmdArgs): Promise<void> | void;

  /**
   * Get subcommand instances
   *
   * Override this method to return an array of subcommand instances.
   * Called during construction to register subcommands.
   *
   * @returns Array of subcommand instances
   *
   * @example
   * ```typescript
   * protected override getSubCommands() {
   *   return [new ProcessCommand(), new ListCommand()];
   * }
   * ```
   */
  protected getSubCommands(): BaseCommand<TContext, TContext>[] {
    return [];
  }

  // --- Internal Wiring ---

  public setParentContext(ctx: TParentContext) {
    this.parentContext = ctx;
  }

  #getCachedSubCommands(): BaseCommand<TContext, TContext>[] {
    if (!this.#subCommands) {
      this.#subCommands = this.getSubCommands();
    }
    return this.#subCommands;
  }

  public registerSubCommands() {
    const subCommands = this.#getCachedSubCommands();
    subCommands.forEach((sub) => {
      sub.registerSubCommands(); // Recursive registration
      this.commander.addCommand(sub.commander);
    });
  }

  #addLoggingOptions(): void {
    const options: Commander.Option[] = [
      new Commander.Option('--log-level <level>', 'Set the threshold log output level.')
        .choices(['FATAL', 'CRITICAL', 'ERROR', 'WARN', 'INFO', 'VERBOSE', 'DEBUG', 'TRACE', 'SPAM', 'SILLY'])
        .argParser((val) => val.toUpperCase()),
      new Commander.Option('--verbose', 'Shortcut for --log verbose'),
      new Commander.Option('-D, --debug', 'Shortcut for --log debug'),
      new Commander.Option('-T, --trace', 'Shortcut for --log trace'),
      new Commander.Option('-S, --spam', 'Shortcut for --log spam'),
      new Commander.Option('--log_show [show]', 'Enable log message output properties')
        .default('level'),
      new Commander.Option('-A, --log-show-all', 'Shortcut for --log_show all'),
      new Commander.Option('--no-color', 'Do not show color in output'),
    ];

    for (const option of options) {
      this.commander.addOption(option);
    }
  }
}
