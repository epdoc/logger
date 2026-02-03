import { Command as CliffyCommand } from '@cliffy/command';
import type * as Ctx from './context.ts';
import type * as CliffApp from './types.ts';

/**
 * Unified command class supporting both class-based and declarative patterns.
 *
 * Handles the complete command lifecycle including:
 * - Option declaration and parsing
 * - Context propagation and refinement down the command tree
 * - Subcommand registration and initialization
 * - Integration with Cliffy's parsing and execution model
 *
 * @template Ctx - The application context type, must extend CliffApp.ICtx
 *
 * @example Class-based usage:
 * ```typescript
 * class MyCommand extends Command<MyContext> {
 *   protected override setupOptions(): void {
 *     this.cmd.description("My command").option("-f, --force", "Force action");
 *   }
 * }
 * ```
 *
 * @example Declarative usage:
 * ```typescript
 * const cmd = new Command({
 *   description: "My command",
 *   options: { "--force": "Force action" },
 *   action: (ctx, opts) => console.log("Hello!")
 * });
 * ```
 */
export class Command<Context extends Ctx.ICtx = Ctx.ICtx> {
  /** The Cliffy Command instance for this command. */
  readonly cmd: CliffyCommand = new CliffyCommand();

  /**
   * Declarative mapping of subcommand names to their class constructors
   * or purely declarative CliffApp.CommandNode objects.
   */
  protected subCommands: CliffApp.SubCommandsConfig<Context> = {};

  /** Active instances of child commands. */
  protected children: Command<Context>[] = [];

  /** Optional declarative node configuration */
  private node?: CliffApp.CommandNode<Context>;

  /** Stored parent context to allow re-refinement after parsing. */
  #parentCtx?: Context;

  /** The current context for this command. */
  #ctx?: Context;

  /**
   * Creates a new Command instance.
   *
   * @param node - Optional declarative configuration. When provided, the command
   *               will be configured from this CommandNode instead of requiring
   *               method overrides.
   *
   * @example Class-based (no node):
   * ```typescript
   * const cmd = new Command();
   * // Override setupOptions(), setupAction(), etc.
   * ```
   *
   * @example Declarative (with node):
   * ```typescript
   * const cmd = new Command({
   *   description: "My command",
   *   action: (ctx, opts) => ctx.log.info.text("Hello!").emit()
   * });
   * ```
   */
  constructor(node?: CliffApp.CommandNode<Context>) {
    this.node = node;
    if (node?.subCommands) {
      this.subCommands = node.subCommands;
    }
  }

  /**
   * Initializes the command by setting up options, subcommands, and actions.
   *
   * This method orchestrates the complete command initialization process:
   * 1. Sets up command options and metadata (setupOptions)
   * 2. Configures global action hooks (configureGlobalHooks)
   * 3. Registers and initializes subcommands
   * 4. Sets up the primary command action (setupAction)
   *
   * Must be called after setContext() and before parsing arguments.
   *
   * @throws {Error} If context is not set before calling init()
   *
   * @example
   * ```typescript
   * const cmd = new Command();
   * await cmd.setContext(myContext);
   * await cmd.init(); // Required before parsing
   * await cmd.cmd.parse(Deno.args);
   * ```
   */
  async init(): Promise<void> {
    this.setupOptions();
    this.configureGlobalHooks();

    // Trigger a post-parse refinement pass using globalAction.
    // We wrap any existing handler (from setupGlobalAction) to allow both to run.
    // deno-lint-ignore no-explicit-any
    const userHandler = (this.cmd as any)['globalActionHandler'];
    this.cmd.globalAction(
      (async (opts: CliffApp.CmdOptions, ...args: CliffApp.CmdArgs) => {
        if (this.#parentCtx) {
          await this.setContext(this.#parentCtx, opts, args);
        }
        if (userHandler) {
          await userHandler(opts, ...args);
        }
        // deno-lint-ignore no-explicit-any
      }) as any,
    );

    // Automatically instantiate and register subcommands
    const subCommands = typeof this.subCommands === 'function' ? await this.subCommands(this.ctx) : this.subCommands;

    if (subCommands) {
      for (const [name, Entry] of Object.entries(subCommands)) {
        let child: Command<Context>;
        if (typeof Entry === 'function') {
          child = new (Entry as new () => Command<Context>)();
        } else {
          child = new Command(Entry as CliffApp.CommandNode<Context>);
        }

        if (this.#ctx) {
          await child.setContext(this.#ctx);
        }
        await child.init();
        this.children.push(child);
        this.cmd.command(name, child.cmd);
      }
    }

    this.setupSubcommands();
    this.setupAction();
  }

  /**
   * Access to the command's context.
   *
   * @throws {Error} If accessed before setContext() is called
   *
   * @example
   * ```typescript
   * protected setupAction(): void {
   *   this.cmd.action(() => {
   *     this.ctx.log.info.text("Hello!").emit(); // Safe to use ctx here
   *   });
   * }
   * ```
   */
  get ctx(): Context {
    if (!this.#ctx) {
      throw new Error(
        `Context not set for command: ${this.cmd.getName() || 'root'}`,
      );
    }
    return this.#ctx;
  }

  /** Convenience getter for the logger. */
  get log(): Ctx.Logger {
    return this.ctx.log;
  }

  /** Convenience getter for debug logging. */
  get debug(): Ctx.MsgBuilder {
    return this.ctx.log.debug;
  }

  /** Convenience getter for verbose logging. */
  get verbose(): Ctx.MsgBuilder {
    return this.ctx.log.verbose;
  }

  /** Convenience getter for info logging. */
  get info(): Ctx.MsgBuilder {
    return this.ctx.log.info;
  }

  /** Convenience getter for warn logging. */
  get warn(): Ctx.MsgBuilder {
    return this.ctx.log.warn;
  }

  /** Convenience getter for error logging. */
  get error(): Ctx.MsgBuilder {
    return this.ctx.log.error;
  }

  /**
   * Sets the context for this command and recursively propagates it to children.
   *
   * The context flows down the command tree, allowing each level to refine it
   * based on parsed options. This enables progressive specialization where
   * root options (like --api-url) can create services (like ApiClient) that
   * are available to all child commands.
   *
   * @param ctx - The context to apply to this command and its children
   * @param opts - Parsed command line options (used for context refinement)
   * @param args - Positional arguments from the command line
   *
   * @example Context refinement:
   * ```typescript
   * // Root command parses --api-url, creates ApiClient
   * await rootCmd.setContext(baseCtx, { apiUrl: "https://api.com" });
   *
   * // Child commands inherit the ApiClient via refined context
   * class UserCmd extends Command {
   *   protected override async deriveChildContext(ctx, opts) {
   *     ctx.userService = new UserService(ctx.apiClient);
   *     return ctx;
   *   }
   * }
   * ```
   */
  async setContext(ctx: Context, opts: CliffApp.CmdOptions = {}, args: CliffApp.CmdArgs = []): Promise<void> {
    this.#parentCtx = ctx;
    this.#ctx = await this.deriveChildContext(ctx, opts, args);

    // Handle context-dependent options for declarative nodes
    if (this.node && typeof this.node.options === 'function') {
      const options = this.node.options(this.#ctx);
      if (options) {
        Object.entries(options).forEach(([flags, def]) => {
          if (typeof def === 'string') {
            this.cmd.option(flags, def);
          } else {
            this.cmd.option(flags, def.description, {
              default: def.default,
              required: def.required,
              hidden: def.hidden,
              collect: def.collect,
            });
          }
        });
      }
    }

    for (const child of this.children) {
      await child.setContext(this.#ctx, opts, args);
    }
  }

  /**
   * Hook for refining or specializing the context as it moves down the command tree.
   *
   * This is where the magic of progressive context refinement happens. Each command
   * can transform the context based on its parsed options, adding services, changing
   * configuration, or creating specialized contexts for its children.
   *
   * @param ctx - The context passed from the parent command
   * @param opts - Parsed command line options for this command level
   * @param args - Positional arguments from the command line
   * @returns The refined context to use for this command and its children
   *
   * @example Adding services to context:
   * ```typescript
   * protected override async deriveChildContext(ctx: MyContext, opts: CmdOptions): Promise<MyContext> {
   *   if (opts.apiUrl) {
   *     ctx.apiClient = new ApiClient(opts.apiUrl);
   *   }
   *
   *   if (opts.database) {
   *     ctx.db = await DatabaseService.connect(opts.database);
   *   }
   *
   *   return ctx;
   * }
   * ```
   *
   * @example Creating specialized context:
   * ```typescript
   * protected override async deriveChildContext(ctx: BaseContext): Promise<AdminContext> {
   *   const adminCtx = new AdminContext();
   *   Object.assign(adminCtx, ctx);
   *   adminCtx.adminService = new AdminService();
   *   return adminCtx;
   * }
   * ```
   */
  protected async deriveChildContext(
    ctx: Context,
    opts: CliffApp.CmdOptions,
    args: CliffApp.CmdArgs,
  ): Promise<Context> {
    if (this.node?.refineContext) {
      return await this.node.refineContext(ctx, opts, args) as Context;
    }
    return ctx;
  }

  /**
   * Lifecycle hook to configure command options, description, and arguments.
   *
   * This is called during the init() phase to set up the command's basic structure.
   * For class-based commands, override this method to define your command's interface.
   * For declarative commands, this is handled automatically from the CommandNode.
   *
   * Note: This is called before context is available, so only declare static options here.
   * Context-dependent options should be handled in deriveChildContext or setupGlobalAction.
   *
   * @example Class-based usage:
   * ```typescript
   * protected override setupOptions(): void {
   *   this.cmd
   *     .description('User management commands')
   *     .option('-f, --force', 'Force the operation')
   *     .option('--batch-size <size:number>', 'Batch size', { default: 100 })
   *     .arguments('<action> [target]');
   * }
   * ```
   *
   * @example Adding logging options:
   * ```typescript
   * protected override setupOptions(): void {
   *   this.cmd.description('My command');
   *   addLoggingOptions(this.cmd, this.ctx); // Adds --verbose, --debug, etc.
   * }
   * ```
   */
  protected setupOptions(): void {
    if (this.node) {
      this.cmd.description(this.node.description);
      if (this.node.version) this.cmd.version(this.node.version);
      if (this.node.arguments) this.cmd.arguments(this.node.arguments);

      // Resolve and register options (context-dependent options will be handled later)
      const options = typeof this.node.options === 'function' ? undefined : this.node.options;
      if (options) {
        Object.entries(options).forEach(([flags, def]) => {
          if (typeof def === 'string') {
            this.cmd.option(flags, def);
          } else {
            this.cmd.option(flags, def.description, {
              default: def.default,
              required: def.required,
              hidden: def.hidden,
              collect: def.collect,
            });
          }
        });
      }
    }
  }

  /**
   * Lifecycle hook to configure global action hooks.
   *
   * Global actions run before any subcommand actions, making them ideal for:
   * - Setting up logging configuration based on global flags
   * - Performing authentication or authorization
   * - Initializing shared resources
   * - Context refinement based on global options
   *
   * @example
   * ```typescript
   * protected override configureGlobalHooks(): void {
   *   this.cmd.globalAction((opts) => {
   *     if (opts.verbose) {
   *       this.ctx.logMgr.threshold = 'verbose';
   *     }
   *
   *     if (opts.apiKey) {
   *       this.ctx.apiClient.setApiKey(opts.apiKey);
   *     }
   *   });
   * }
   * ```
   */
  protected configureGlobalHooks(): void {
    if (this.node?.setupGlobalAction) {
      this.node.setupGlobalAction(this.cmd, this.ctx);
    }
  }

  /**
   * Lifecycle hook for manual subcommand registration.
   *
   * This is called after automatic subcommand registration from the `subCommands`
   * property. Use this for dynamic subcommand registration or when you need
   * more control over the registration process.
   *
   * Most commands won't need to override this - use the `subCommands` property
   * or declarative `subCommands` in CommandNode instead.
   *
   * @example Dynamic subcommand registration:
   * ```typescript
   * protected override setupSubcommands(): void {
   *   // Add plugin-based commands
   *   for (const plugin of this.ctx.plugins) {
   *     this.cmd.command(plugin.name, plugin.createCommand());
   *   }
   * }
   * ```
   */
  protected setupSubcommands(): void {}

  /**
   * Lifecycle hook to configure the primary action for this command.
   *
   * This defines what happens when the command is executed. For class-based
   * commands, override this method to define your command's behavior.
   * For declarative commands, this is handled automatically from the CommandNode.
   *
   * @example Simple action:
   * ```typescript
   * protected override setupAction(): void {
   *   this.cmd.action((opts, ...args) => {
   *     this.ctx.log.info.text(`Hello ${opts.name || 'World'}!`).emit();
   *   });
   * }
   * ```
   *
   * @example Complex action with validation:
   * ```typescript
   * protected override setupAction(): void {
   *   this.cmd.action(async (opts, ...args) => {
   *     const [target] = args as [string];
   *
   *     if (!target) {
   *       throw new Error('Target is required');
   *     }
   *
   *     if (this.ctx.dryRun) {
   *       this.ctx.log.info.text(`Would process: ${target}`).emit();
   *       return;
   *     }
   *
   *     await this.processTarget(target, opts);
   *   });
   * }
   * ```
   */
  protected setupAction(): void {
    if (this.node?.action) {
      this.cmd.action(async (opts: unknown, ...args: unknown[]) => {
        await this.node!.action!(this.ctx, opts as CliffApp.CmdOptions, ...args);
      });
    }
  }
}
