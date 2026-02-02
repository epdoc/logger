import { Command as CliffyCommand } from '@cliffy/command';
import type * as Base from './types.ts';

/**
 * Base class for all commands, providing declarative subcommand management,
 * recursive context propagation, and lifecycle hooks.
 *
 * @template Ctx - The application context type, must extend Base.ICtx.
 */
export class Command<Ctx extends Base.ICtx = Base.ICtx> {
  /** The Cliffy Command instance for this command. */
  readonly cmd: CliffyCommand = new CliffyCommand();

  /**
   * Declarative mapping of subcommand names to their class constructors
   * or purely declarative Base.CommandNode objects.
   */
  protected subCommands: Base.SubCommandsConfig<Ctx> = {};

  /** Active instances of child commands. */
  protected children: Command<Ctx>[] = [];

  /** Optional declarative node configuration */
  private node?: Base.CommandNode<Ctx>;

  /** Stored parent context to allow re-refinement after parsing. */
  #parentCtx?: Ctx;

  /** The current context for this command. */
  #ctx?: Ctx;

  /**
   * Creates a new AbstractCmd. Can optionally be configured from a CommandNode.
   * @param node Optional declarative configuration
   */
  constructor(node?: Base.CommandNode<Ctx>) {
    this.node = node;
    if (node?.subCommands) {
      this.subCommands = node.subCommands;
    }
  }

  /**
   * Initializes the command by setting up options, subcommands, and actions.
   * This should be called once after instantiation.
   */
  async init(): Promise<void> {
    this.setupOptions();
    this.configureGlobalHooks();

    // Trigger a post-parse refinement pass using globalAction.
    // We wrap any existing handler (from setupGlobalAction) to allow both to run.
    // deno-lint-ignore no-explicit-any
    const userHandler = (this.cmd as any)['globalActionHandler'];
    this.cmd.globalAction(
      (async (opts: Base.CmdOptions, ...args: Base.CmdArgs) => {
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
        let child: Command<Ctx>;
        if (typeof Entry === 'function') {
          child = new (Entry as new () => Command<Ctx>)();
        } else {
          child = new Command(Entry as Base.CommandNode<Ctx>);
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

  /** Access to the command's context. Throws if accessed before being set. */
  get ctx(): Ctx {
    if (!this.#ctx) {
      throw new Error(
        `Context not set for command: ${this.cmd.getName() || 'root'}`,
      );
    }
    return this.#ctx;
  }

  /** Convenience getter for the logger. */
  get log(): Base.Logger {
    return this.ctx.log;
  }

  /** Convenience getter for debug logging. */
  get debug(): Base.MsgBuilder {
    return this.ctx.log.debug;
  }

  /** Convenience getter for verbose logging. */
  get verbose(): Base.MsgBuilder {
    return this.ctx.log.verbose;
  }

  /** Convenience getter for info logging. */
  get info(): Base.MsgBuilder {
    return this.ctx.log.info;
  }

  /** Convenience getter for warn logging. */
  get warn(): Base.MsgBuilder {
    return this.ctx.log.warn;
  }

  /** Convenience getter for error logging. */
  get error(): Base.MsgBuilder {
    return this.ctx.log.error;
  }

  /**
   * Sets the context for this command and recursively propagates it to children.
   * The context can be transformed by the deriveChildContext hook.
   *
   * @param ctx - The new context to apply.
   * @param opts - Options from the command line.
   * @param args - Positional arguments from the command line.
   */
  async setContext(ctx: Ctx, opts: Base.CmdOptions = {}, args: Base.CmdArgs = []): Promise<void> {
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
   * Hook for refining or specializing the context as it moves down the tree.
   * Override this to create child contexts with specialized settings.
   *
   * @param ctx - The context passed from the parent.
   * @param _opts - Options from the command line.
   * @param _args - Positional arguments from the command line.
   * @returns The refined context to use for this command and its children.
   */
  protected async deriveChildContext(
    ctx: Ctx,
    opts: Base.CmdOptions,
    args: Base.CmdArgs,
  ): Promise<Ctx> {
    if (this.node?.refineContext) {
      return await this.node.refineContext(ctx, opts, args) as Ctx;
    }
    return ctx;
  }

  /**
   * Lifecycle hook to configure command options, description, and arguments.
   *
   * @example
   * ```ts
   * protected setupOptions(): void {
   *   this.cmd.description('My Command').option('-f, --force', 'Force action');
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
   * Lifecycle hook to configure global hooks. Global actions run before
   * subcommand actions. Useful for context refinement based on global flags.
   */
  protected configureGlobalHooks(): void {
    if (this.node?.setupGlobalAction) {
      this.node.setupGlobalAction(this.cmd, this.ctx);
    }
  }

  /**
   * Lifecycle hook for manual subcommand registration (if declarative is not used).
   */
  protected setupSubcommands(): void {}

  /**
   * Lifecycle hook to configure the primary action for this command.
   */
  protected setupAction(): void {
    if (this.node?.action) {
      this.cmd.action(async (opts: unknown, ...args: unknown[]) => {
        await this.node!.action!(this.ctx, opts as Base.CmdOptions, ...args);
      });
    }
  }
}
