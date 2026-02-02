import { Command } from '@cliffy/command';
import type { CommandNode, GenericOptions, ICtx, Logger, MsgBuilder, SubCommandsConfig } from './types.ts';

/**
 * Base class for all commands, providing declarative subcommand management,
 * recursive context propagation, and lifecycle hooks.
 *
 * @template Ctx - The application context type, must extend ICtx.
 */
export abstract class AbstractCmd<Ctx extends ICtx = ICtx> {
  /** The Cliffy Command instance for this command. */
  readonly cmd: Command = new Command();

  /**
   * Declarative mapping of subcommand names to their class constructors
   * or purely declarative CommandNode objects.
   */
  protected subCommands: SubCommandsConfig<Ctx> = {};

  /** Active instances of child commands. */
  protected children: AbstractCmd<Ctx>[] = [];

  /** Stored parent context to allow re-refinement after parsing. */
  #parentCtx?: Ctx;

  /** The current context for this command. */
  #ctx?: Ctx;

  /**
   * Initializes the command by setting up options, subcommands, and actions.
   * This should be called once after instantiation.
   */
  init(): void {
    this.setupOptions();
    this.setupGlobalAction();

    // Trigger a post-parse refinement pass using globalAction.
    // We wrap any existing handler (from setupGlobalAction) to allow both to run.
    // deno-lint-ignore no-explicit-any
    const userHandler = (this.cmd as any)['globalActionHandler'];
    this.cmd.globalAction(
      (async (opts: GenericOptions, ...args: unknown[]) => {
        if (this.#parentCtx) {
          this.setContext(this.#parentCtx, opts, args);
        }
        if (userHandler) {
          await userHandler(opts, ...args);
        }
        // deno-lint-ignore no-explicit-any
      }) as any,
    );

    // Automatically instantiate and register subcommands
    const subCommands = typeof this.subCommands === 'function' ? this.subCommands(this.ctx) : this.subCommands;

    for (const [name, Entry] of Object.entries(subCommands)) {
      let child: AbstractCmd<Ctx>;
      if (typeof Entry === 'function') {
        child = new (Entry as new () => AbstractCmd<Ctx>)();
      } else {
        child = new ProxyCmd(Entry as CommandNode<Ctx>) as unknown as AbstractCmd<
          Ctx
        >;
      }

      if (this.#ctx) {
        child.setContext(this.#ctx);
      }
      child.init();
      this.children.push(child);
      this.cmd.command(name, child.cmd);
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
  get log(): Logger {
    return this.ctx.log;
  }

  /** Convenience getter for debug logging. */
  get debug(): MsgBuilder {
    return this.ctx.log.debug;
  }

  /** Convenience getter for verbose logging. */
  get verbose(): MsgBuilder {
    return this.ctx.log.verbose;
  }

  /** Convenience getter for info logging. */
  get info(): MsgBuilder {
    return this.ctx.log.info;
  }

  /** Convenience getter for warn logging. */
  get warn(): MsgBuilder {
    return this.ctx.log.warn;
  }

  /** Convenience getter for error logging. */
  get error(): MsgBuilder {
    return this.ctx.log.error;
  }

  /**
   * Sets the context for this command and recursively propagates it to children.
   * The context can be transformed by the refineContext hook.
   *
   * @param ctx - The new context to apply.
   * @param opts - Options from the command line.
   * @param args - Positional arguments from the command line.
   */
  setContext(ctx: Ctx, opts: GenericOptions = {}, args: unknown[] = []): void {
    this.#parentCtx = ctx;
    this.#ctx = this.refineContext(ctx, opts, args);
    for (const child of this.children) {
      child.setContext(this.#ctx, opts, args);
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
  protected refineContext(
    ctx: Ctx,
    _opts: GenericOptions,
    _args: unknown[],
  ): Ctx {
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
  protected setupOptions(): void {}

  /**
   * Lifecycle hook to configure global actions. Global actions run before
   * subcommand actions. Useful for context refinement based on global flags.
   */
  protected setupGlobalAction(): void {}

  /**
   * Lifecycle hook for manual subcommand registration (if declarative is not used).
   */
  protected setupSubcommands(): void {}

  /**
   * Lifecycle hook to configure the primary action for this command.
   */
  protected setupAction(): void {}
}

/**
 * A specialized AbstractCmd that builds itself from a declarative CommandNode.
 * This class facilitates the hybrid model where object literals can be used
 * as subcommands within a class-based hierarchy.
 */
export class ProxyCmd<Ctx extends ICtx = ICtx> extends AbstractCmd<Ctx> {
  /**
   * Creates a new ProxyCmd from a declarative node.
   * @param node The CommandNode definition to wrap.
   */
  constructor(private node: CommandNode<Ctx>) {
    super();
    // Copy subcommands from the node to the class property
    if (this.node.subCommands) {
      this.subCommands = this.node.subCommands;
    }
  }

  protected override refineContext(
    ctx: Ctx,
    opts: GenericOptions,
    args: unknown[],
  ): Ctx {
    if (this.node.refineContext) {
      return this.node.refineContext(ctx, opts, args) as Ctx;
    }
    return ctx;
  }

  protected override setupGlobalAction(): void {
    if (this.node.setupGlobalAction) {
      this.node.setupGlobalAction(this.cmd, this.ctx);
    }
  }

  protected override setupOptions(): void {
    const cmd = this.cmd;
    cmd.description(this.node.description);
    if (this.node.version) cmd.version(this.node.version);
    if (this.node.arguments) cmd.arguments(this.node.arguments);

    // Resolve and register options
    const options = typeof this.node.options === 'function' ? this.node.options(this.ctx) : this.node.options;

    if (options) {
      Object.entries(options).forEach(([flags, def]) => {
        if (typeof def === 'string') {
          cmd.option(flags, def);
        } else {
          cmd.option(flags, def.description, {
            default: def.default,
            required: def.required,
            hidden: def.hidden,
            collect: def.collect,
          });
        }
      });
    }
  }

  protected override setupAction(): void {
    if (this.node.action) {
      this.cmd.action(async (opts: unknown, ...args: unknown[]) => {
        await this.node.action!(this.ctx, opts as GenericOptions, ...args);
      });
    }
  }
}
