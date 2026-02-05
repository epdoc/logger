/**
 * @file Enhanced CLI Command class extending Commander.js
 * @description Provides a CLI command class that integrates with @epdoc/logger,
 * adds standardized logging options, and manages application context.
 * @module
 */

import * as _ from '@epdoc/type';
import * as colors from '@std/fmt/colors';
import * as Commander from 'commander';
import { config } from './config.ts';
import { FluentOptionBuilder } from './option.ts';
import type {
  CmdArgs,
  CmdOptions,
  CommandConstructor,
  CommandNode,
  DenoPkg,
  ICtx,
  Logger,
  LogOptions,
  MsgBuilder,
} from './types.ts';
import { commaList } from './utils.ts';

/**
 * Enhanced CLI command class extending Commander.Command
 *
 * Integrates logging, context management, and standardized options for building
 * robust CLI applications. Provides automatic integration with @epdoc/logger
 * and consistent option handling across commands.
 *
 * @template M - Message builder type extending MsgBuilder
 * @template L - Logger type extending Logger<M>
 *
 * @example
 * ```typescript
 * const cmd = new Command(pkg);
 * cmd.init(ctx);
 * cmd.option('--input <file>', 'Input file');
 * cmd.addLogging(ctx);
 *
 * cmd.action(async (opts) => {
 *   console.log('Processing:', opts.input);
 * });
 *
 * await cmd.parseAsync();
 * ```
 */
export class Command<
  Context extends ICtx<M, L> = ICtx<M, L>,
  SubContext extends Context = Context,
  M extends MsgBuilder = MsgBuilder,
  L extends Logger<M> = Logger<M>,
> extends Commander.Command {
  /** Package metadata from deno.json */
  pkg: DenoPkg;

  /** Current context instance */
  protected _ctx?: Context;

  /** Declarative command node configuration */
  protected node?: CommandNode<Context>;

  /**
   * Declarative mapping of subcommand names to their class constructors
   * or purely declarative CommandNode objects.
   */
  protected subCommands?:
    | Record<string, CommandConstructor<Context> | CommandNode<Context>>
    | ((ctx: Context) => Promise<Record<string, CommandConstructor<Context> | CommandNode<Context>>>);

  /**
   * Creates a new Command instance
   *
   * @param pkg - Package metadata containing name, version, and description
   * @param node - Optional declarative command configuration
   *
   * @example
   * ```typescript
   * import pkg from './deno.json' with { type: 'json' };
   * const cmd = new Command(pkg);
   * ```
   */
  constructor(pkg: DenoPkg, node?: CommandNode<Context>) {
    super(pkg.name);
    this.pkg = pkg;
    this.node = node;
  }

  /**
   * Initializes the command with package metadata and standard configuration
   *
   * Sets up version, description, help formatting, and error handling based on
   * the package metadata and application context. Should be called before
   * adding options or defining actions.
   *
   * @param ctx - Application context for configuration
   * @returns This command instance for method chaining
   *
   * @example
   * ```typescript
   * const cmd = new Command(pkg);
   * cmd.init(ctx);
   * // Now ready to add options and actions
   * ```
   */
  init(ctx: Context): this {
    this._ctx = ctx;

    if (this.pkg.version) {
      this.version(this.pkg.version, '-v, --version', 'Output the current version.');
    }
    if (this.pkg.description) {
      this.description(this.pkg.description);
    }
    this.configureHelp(config.help).configureOutput(config.output);

    // Setup declarative configuration if provided
    if (this.node) {
      this.setupFromNode();
    }

    // Setup subcommands
    this.setupSubcommands();

    return this;
  }

  /**
   * Get the current context
   */
  get ctx(): Context {
    if (!this._ctx) {
      throw new Error('Context not initialized. Call init() first.');
    }
    return this._ctx;
  }

  /**
   * Derive child context for subcommands
   * Override this method to transform context when passing to subcommands
   */
  protected async deriveChildContext(
    ctx: Context,
    opts: CmdOptions,
    args: CmdArgs,
  ): Promise<SubContext> {
    // Default implementation - return context as-is
    return ctx as SubContext;
  }

  /**
   * Setup command from declarative node configuration
   */
  protected setupFromNode(): void {
    if (!this.node) return;

    if (this.node.description) {
      this.description(this.node.description);
    }

    if (this.node.aliases) {
      this.aliases(this.node.aliases);
    }

    if (this.node.options) {
      for (const [flag, config] of Object.entries(this.node.options)) {
        const desc = typeof config === 'string' ? config : config.description;
        this.option(flag, desc);
      }
    }

    if (this.node.arguments) {
      for (const arg of this.node.arguments) {
        this.argument(arg);
      }
    }

    if (this.node.action) {
      this.action(async (...args: unknown[]) => {
        const opts = this.opts();
        await this.node!.action!(this.ctx, opts, ...args as string[]);
      });
    }
  }

  /**
   * Setup subcommands from declarative configuration or class-based definitions
   */
  protected async setupSubcommands(): Promise<void> {
    if (!this.subCommands) return;

    const subCommands = typeof this.subCommands === 'function' ? await this.subCommands(this.ctx) : this.subCommands;

    for (const [name, Entry] of Object.entries(subCommands)) {
      let child: Command<SubContext>;

      if (typeof Entry === 'function') {
        // Class constructor
        child = new (Entry as CommandConstructor<SubContext>)(this.pkg);
      } else {
        // Declarative CommandNode
        child = new Command<SubContext>(this.pkg, Entry as CommandNode<SubContext>);
      }

      // Initialize child with derived context
      const childCtx = await this.deriveChildContext(this.ctx, {}, []);
      child.init(childCtx);

      this.addCommand(child, { isDefault: false });
    }
  }

  /**
   * Adds standard logging options - now uses clean context system
   *
   * @example
   * ```typescript
   * cmd.addLogging(); // Uses this.ctx automatically - much cleaner!
   * ```
   */
  addLogging(): this {
    const ctx = this.ctx; // Clean context access
    const options: Commander.Option[] = [
      new Commander.Option('--log <level>', 'Set the threshold log output level.')
        .choices(ctx.logMgr.logLevels.names)
        .argParser((val) => val.toUpperCase()),
      new Commander.Option(
        '--log_show [show]',
        'Enable log message output of log level, date and emitting package. ' +
          'Can comma separate ' +
          colors.blue('level|level:icon|level:int|package|reqId|utc|locale|elapsed|time|all') +
          '. E.g. ' +
          colors.green('--log_show level,elapsed,package') +
          ', or ' +
          colors.green('--log_show all') +
          ' or the equivalent ' +
          colors.green('-A'),
      ).argParser(commaList),
      new Commander.Option('--no-color', 'Do not show color in output'),
      new Commander.Option('-A --showall', 'Shortcut for ' + colors.green('--log_show all')),
      new Commander.Option('-V --verbose', 'Shortcut for ' + colors.green('--log verbose')),
      new Commander.Option('-D --debug', 'Shortcut for ' + colors.green('--log debug')),
      new Commander.Option('-T --trace', 'Shortcut for ' + colors.green('--log trace')),
      new Commander.Option('-S --spam', 'Shortcut for ' + colors.green('--log spam')),
    ];
    options.forEach((option) => {
      this.addOption(option);
    });
    return this;
  }

  /**
   * Adds a dry-run option to the command
   *
   * Provides the standard --dry-run/-n option that allows users to preview
   * what the command would do without making actual changes. This is a common
   * pattern in CLI tools for safe operation testing.
   *
   * @returns This command instance for method chaining
   *
   * @example
   * ```typescript
   * cmd.addDryRun();
   *
   * // Usage: my-app --dry-run
   * // Usage: my-app -n
   *
   * cmd.action(async (opts) => {
   *   if (opts.dryRun) {
   *     console.log('Would delete file:', filename);
   *   } else {
   *     await Deno.remove(filename);
   *   }
   * });
   * ```
   */
  addDryRun(): this {
    const option: Commander.Option = new Commander.Option(
      '-n --dry-run',
      'Do not modify any existing data or files',
    ).default(false);
    this.addOption(option);
    return this;
  }

  /**
   * Adds a recursive processing option to the command
   *
   * Provides the --recursive/-R option for commands that need to process
   * files and directories recursively. Optionally accepts a depth parameter
   * to limit recursion levels.
   *
   * @returns This command instance for method chaining
   *
   * @example
   * ```typescript
   * cmd.addRecursion();
   *
   * // Usage: my-app --recursive
   * // Usage: my-app -R 3  (limit to 3 levels deep)
   *
   * cmd.action(async (opts) => {
   *   const depth = opts.recursive || 1;
   *   await processDirectory('.', depth);
   * });
   * ```
   */
  addRecursion(): this {
    const option: Commander.Option = new Commander.Option(
      '-R, --recursive [depth]',
      'Recursively process files and folders. ' + colors.yellow('[depth]') + ' is the recursion depth.',
    )
      .default(1)
      .argParser((val) => _.asInt(val, 1));
    this.addOption(option);
    return this;
  }

  /**
   * Adds a files argument to the command
   *
   * Provides a variadic <files...> argument that accepts multiple file paths.
   * Useful for commands that operate on a set of input files. Supports glob
   * patterns for file selection.
   *
   * @returns This command instance for method chaining
   *
   * @example
   * ```typescript
   * cmd.addFiles();
   *
   * // Usage: my-app file1.txt file2.txt
   * // Usage: my-app *.txt
   * // Usage: my-app src/**\/*.ts
   *
   * cmd.action(async (files, opts) => {
   *   for (const file of files) {
   *     await processFile(file);
   *   }
   * });
   * ```
   */
  addFiles(): this {
    const argument: Commander.Argument = new Commander.Argument(
      '<files...>',
      'Use glob * to get a list of files in the current directory',
    );
    this.addArgument(argument);
    return this;
  }

  /**
   * Parses command-line options from Deno.args
   *
   * Integrates with Deno's runtime to capture and parse command-line arguments.
   * This method should be called after all options and arguments have been
   * defined but before accessing the parsed values.
   *
   * @returns Promise resolving to parsed command-line options
   *
   * @example
   * ```typescript
   * const cmd = new Command(pkg);
   * cmd.init(ctx);
   * cmd.option('--input <file>', 'Input file');
   * cmd.addLogging(ctx);
   *
   * const opts = await cmd.parseOpts();
   * console.log('Input file:', opts.input);
   * ```
   */
  async parseOpts(): Promise<LogOptions> {
    await super.parseAsync(['xx', 'yy', ...Deno.args]);
    return this.opts() as LogOptions;
  }

  /**
   * Create a fluent option builder for advanced option configuration
   *
   * Provides a fluent API for building complex options with validation,
   * defaults, and parsing. Similar to the MsgBuilder pattern.
   *
   * @param flags - Option flags (e.g., '-l, --lines <num>')
   * @param description - Option description for help text
   * @returns FluentOptionBuilder for method chaining
   *
   * @example
   * ```typescript
   * this.cmd
   *   .fluentOption('-l --lines [num]', 'Number of lines')
   *   .default(10)
   *   .argParser(_.asInt)
   *   .done()
   *   .fluentOption('--format <type>', 'Output format')
   *   .choices(['json', 'yaml', 'table'])
   *   .default('table')
   *   .done();
   * ```
   */
  fluentOption(flags: string, description: string): FluentOptionBuilder<this> {
    return new FluentOptionBuilder(this, flags, description);
  }

  /**
   * Shorthand alias for fluentOption()
   *
   * @param flags - Option flags (e.g., '-l, --lines <num>')
   * @param description - Option description for help text
   * @returns FluentOptionBuilder for method chaining
   *
   * @example
   * ```typescript
   * this.cmd
   *   .opt('-l --lines [num]', 'Number of lines')
   *   .default(10)
   *   .argParser(_.asInt)
   *   .done();
   * ```
   */
  opt(flags: string, description: string): FluentOptionBuilder<this> {
    return this.fluentOption(flags, description);
  }
}
