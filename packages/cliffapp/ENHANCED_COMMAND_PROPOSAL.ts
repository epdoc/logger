/**
 * Enhanced Command class supporting reusable commands as both root and subcommands.
 * 
 * Key changes:
 * 1. Add CommandMode enum to control behavior
 * 2. Add setMode() method to switch between root/subcommand behavior
 * 3. Modify setupOptions() to conditionally add logging options
 * 4. Modify action handling to conditionally configure logging
 */

export enum CommandMode {
  /** Command acts as root - adds logging options and configures logging */
  ROOT = 'root',
  /** Command acts as subcommand - inherits context from parent */
  SUBCOMMAND = 'subcommand',
  /** Command adapts automatically based on context */
  AUTO = 'auto'
}

export class Command<Context extends Ctx.ICtx = Ctx.ICtx> {
  readonly cmd: CliffyCommand = new CliffyCommand();
  protected subCommands: CliffApp.SubCommandsConfig<Context> = {};
  protected children: Command<Context>[] = [];
  private node?: CliffApp.CommandNode<Context>;
  #parentCtx?: Context;
  #ctx?: Context;
  #mode: CommandMode = CommandMode.AUTO;
  #isRoot: boolean = false;

  constructor(node?: CliffApp.CommandNode<Context>) {
    this.node = node;
    if (node?.subCommands) {
      this.subCommands = node.subCommands;
    }
  }

  /**
   * Set the command mode to control root vs subcommand behavior.
   */
  setMode(mode: CommandMode): this {
    this.#mode = mode;
    return this;
  }

  /**
   * Enhanced setContext that determines if this is a root command.
   */
  async setContext(ctx: Context, opts: CliffApp.CmdOptions = {}, args: CliffApp.CmdArgs = []): Promise<void> {
    this.#parentCtx = ctx;
    
    // Determine if this is a root command
    this.#isRoot = this.#determineIsRoot(ctx, opts);
    
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
   * Determine if this command should act as root based on mode and context.
   */
  #determineIsRoot(ctx: Context, opts: CliffApp.CmdOptions): boolean {
    switch (this.#mode) {
      case CommandMode.ROOT:
        return true;
      case CommandMode.SUBCOMMAND:
        return false;
      case CommandMode.AUTO:
        // Auto-detect: if context has no parent indicators, assume root
        // This could be enhanced with more sophisticated detection
        return !opts._isSubcommand;
      default:
        return false;
    }
  }

  /**
   * Enhanced setupOptions that conditionally adds logging options.
   */
  protected setupOptions(): void {
    // Call the original setupOptions logic
    this.setupCommandOptions();
    
    // Add logging options only if this is a root command
    if (this.#isRoot) {
      CliffApp.addLoggingOptions(this.cmd, this.#ctx);
    }
  }

  /**
   * Separated command-specific options setup (override this instead of setupOptions).
   */
  protected setupCommandOptions(): void {
    if (this.node) {
      this.cmd.description(this.node.description);
      if (this.node.version) this.cmd.version(this.node.version);
      if (this.node.arguments) this.cmd.arguments(this.node.arguments);

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
   * Enhanced setupAction that conditionally configures logging.
   */
  protected setupAction(): void {
    if (this.node?.action) {
      this.cmd.action(async (opts: unknown, ...args: unknown[]) => {
        // Configure logging only if this is a root command
        if (this.#isRoot) {
          CliffApp.configureLogging(this.#ctx!, opts as CliffApp.CmdOptions);
        }
        
        await this.node!.action!(this.#ctx!, opts as CliffApp.CmdOptions, ...args);
      });
    }
  }

  // ... rest of the existing Command class methods remain unchanged
}
