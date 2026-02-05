import * as _ from '@epdoc/type';
import * as colors from '@std/fmt/colors';
import * as Commander from 'commander';
import { assert } from 'node:console';
import { config } from './config.ts';
import { FluentOptionBuilder } from './option.ts';
import type { CmdArgs, CmdOptions, CommandConstructor, CommandNode, ICtx } from './types.ts';
import { commaList } from './utils.ts';

/**
 * Enhanced CLI command class with automatic context flow and declarative configuration
 */
export class Command<
  Context extends ICtx = ICtx,
  Options extends CmdOptions = CmdOptions,
  DerivedContext extends Context = Context,
> extends Commander.Command {
  /** Current context instance */
  protected _ctx?: Context;

  /** Track if this is a root command */
  private _isRoot = false;

  /** Optional declarative command node configuration */
  protected node?: CommandNode<Context>;

  /**
   * Declarative mapping of subcommand names to their class constructors
   * or purely declarative CommandNode objects.
   */
  protected subCommands?:
    | Record<string, CommandConstructor<Context> | CommandNode<Context>>
    | ((ctx: Context) => Promise<Record<string, CommandConstructor<Context> | CommandNode<Context>>>);

  /**
   * Default action method that shows help.
   *
   * Override this method in subclasses to define custom behavior.
   * The framework automatically handles logging configuration for root commands.
   *
   * @param opts - Parsed command line options
   * @param args - Positional arguments from the command line
   */
  protected execute(_opts: Options, _args: CmdArgs): Promise<void> | void {
    // Default behavior: show help
    this.help();
  }

  /**
   * Creates a new Command instance
   */
  constructor(node?: CommandNode<Context>) {
    super();
    this.node = node;
  }

  /**
   * Initialize the command with context and setup
   */
  async init(ctx: Context): Promise<this> {
    this._ctx = ctx;

    // Detect if this is a root command (no parent)
    this._isRoot = !this.parent;

    const pkg = this.ctx.pkg;
    if (pkg) {
      pkg.name && this.name(pkg.name);
      pkg.version && this.version(pkg.version, '-v, --version', 'Output the current version.');
      pkg.description && this.description(pkg.description);
    }
    this.configureHelp(config.help).configureOutput(config.output);

    // Setup from declarative node configuration
    if (this.node) {
      this.setupFromNode();
    }

    // Automatically add logging options for root commands
    if (this._isRoot) {
      this.addLogging();
    }

    // Setup subcommands
    await this.setupSubcommands();

    return this;
  }

  /**
   * Get the current context
   */
  get ctx(): Context {
    assert(this._ctx, 'Context not initialized. Call init() first.');
    return this._ctx!;
  }

  /**
   * Derive child context for subcommands
   * Override this method to transform context when passing to subcommands
   */
  protected async deriveChildContext(
    ctx: Context,
    opts: CmdOptions,
    args: CmdArgs,
  ): Promise<DerivedContext> {
    if (this.node?.refineContext) {
      return await this.node.refineContext(ctx, opts, args) as DerivedContext;
    }
    return ctx as DerivedContext;
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
        const desc = typeof config === 'string' ? config : (config as { description: string }).description;
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

    const subCommands = _.isFunction(this.subCommands) ? await this.subCommands(this.ctx) : this.subCommands;

    for (const [name, Entry] of Object.entries(subCommands)) {
      let child: Command<DerivedContext>;

      if (_.isFunction(Entry)) {
        // Class constructor
        child = new (Entry as unknown as CommandConstructor<DerivedContext>)(this.ctx.pkg);
      } else {
        // Declarative CommandNode
        child = new Command<DerivedContext>(Entry as unknown as CommandNode<DerivedContext>);
      }

      // Set the command name
      child.name(name);

      // Store the original action handler
      const originalActionHandler = (child as any)._actionHandler;

      // Wrap the action handler to derive context at runtime
      (child as any)._actionHandler = async (...args: unknown[]) => {
        // Derive context with actual runtime options from parent
        const parentOpts = this.opts();
        const childCtx = await this.deriveChildContext(this.ctx, parentOpts, args as string[]);
        await child.init(childCtx);

        // Call the original action handler
        if (originalActionHandler) {
          return await originalActionHandler.apply(child, args);
        }
      };

      this.addCommand(child);
    }
  }

  /**
   * Adds standard logging options using clean context system
   */
  addLogging(): this {
    const ctx = this.ctx;
    const options: Commander.Option[] = [
      new Commander.Option('--log-level <level>', 'Set the threshold log output level.')
        .choices(ctx.logMgr.logLevels.names)
        .argParser((val) => val.toUpperCase()),
      new Commander.Option('--verbose', 'Shortcut for --log verbose'),
      new Commander.Option('-D, --debug', 'Shortcut for --log debug'),
      new Commander.Option('-T, --trace', 'Shortcut for --log trace'),
      new Commander.Option('-S, --spam', 'Shortcut for --log spam'),
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
      )
        .default('level')
        .argParser(commaList),
      new Commander.Option('-A, --log-show-all', 'Shortcut for --log_show all'),
      new Commander.Option('--no-color', 'Do not show color in output'),
    ];

    for (const option of options) {
      this.addOption(option);
    }
    return this;
  }

  /**
   * Adds a dry-run option to the command
   */
  addDryRun(): this {
    const option = new Commander.Option(
      '-n, --dry-run',
      'Do not modify any existing data or files',
    ).default(false);
    this.addOption(option);
    return this;
  }

  /**
   * Adds a recursion option to the command
   */
  addRecursion(): this {
    const option = new Commander.Option(
      '-r, --recurse [depth]',
      'Recursively process files and folders. ' + colors.yellow('[depth]') + ' is the recursion depth.',
    )
      .default(1)
      .argParser((val) => _.asInt(val, 1));
    this.addOption(option);
    return this;
  }

  /**
   * Adds a files argument to the command
   */
  addFiles(): this {
    this.argument('[files...]', 'Files to process');
    return this;
  }

  /**
   * Parses command-line arguments and returns typed options
   */
  async parseOpts(): Promise<Options> {
    await super.parseAsync(['xx', 'yy', ...Deno.args]);
    return this.opts() as Options;
  }

  /**
   * Creates a fluent option builder for chainable option configuration
   */
  opt(flags: string, description: string): FluentOptionBuilder<this> {
    return new FluentOptionBuilder(this, flags, description);
  }

  /**
   * Alias for opt() method
   */
  fluentOption(flags: string, description: string): FluentOptionBuilder<this> {
    return this.opt(flags, description);
  }
}
