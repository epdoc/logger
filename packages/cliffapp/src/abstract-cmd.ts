import { Command } from '@cliffy/command';
import type { ICtx, Logger, MsgBuilder } from './types.ts';

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
   * Declarative mapping of subcommand names to their class constructors.
   * Children are automatically instantiated and registered during init().
   */
  protected subCommands: Record<string, new () => AbstractCmd<Ctx>> = {};

  /** Active instances of child commands. */
  protected children: AbstractCmd<Ctx>[] = [];

  /** The current context for this command. */
  #ctx?: Ctx;

  /**
   * Initializes the command by setting up options, subcommands, and actions.
   * This should be called once after instantiation.
   */
  init(): void {
    this.setupOptions();
    this.setupGlobalAction();

    // Automatically instantiate and register subcommands
    for (const [name, ChildClass] of Object.entries(this.subCommands)) {
      const child = new ChildClass();
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
   */
  setContext(ctx: Ctx): void {
    this.#ctx = this.refineContext(ctx);
    for (const child of this.children) {
      child.setContext(this.#ctx);
    }
  }

  /**
   * Hook for refining or specializing the context as it moves down the tree.
   * Override this to create child contexts with specialized settings.
   *
   * @param ctx - The context passed from the parent.
   * @returns The refined context to use for this command and its children.
   */
  protected refineContext(ctx: Ctx): Ctx {
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
