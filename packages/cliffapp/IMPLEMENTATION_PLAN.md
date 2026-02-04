/**
 * ARCHITECTURAL PROPOSAL: Reusable Commands for CliffApp
 * 
 * Problem: Commands need to be duplicated to work as both root and subcommands
 * Solution: Add mode-aware behavior to Command class
 */

// 1. Add CommandMode enum to types.ts
export enum CommandMode {
  /** Command acts as root - adds logging options and configures logging */
  ROOT = 'root',
  /** Command acts as subcommand - inherits context from parent */
  SUBCOMMAND = 'subcommand', 
  /** Command adapts automatically based on usage */
  AUTO = 'auto'
}

// 2. Minimal changes to Command class in command.ts

export class Command<Context extends Ctx.ICtx = Ctx.ICtx> {
  // ... existing properties ...
  #mode: CommandMode = CommandMode.AUTO;
  #isRoot: boolean = false;

  /**
   * Set command mode to control root vs subcommand behavior.
   */
  setMode(mode: CommandMode): this {
    this.#mode = mode;
    return this;
  }

  /**
   * Enhanced setContext to detect root vs subcommand usage.
   */
  async setContext(ctx: Context, opts: CliffApp.CmdOptions = {}, args: CliffApp.CmdArgs = []): Promise<void> {
    this.#parentCtx = ctx;
    
    // Determine if this is root based on mode and context markers
    this.#isRoot = this.#determineIsRoot(opts);
    
    // ... rest of existing setContext logic ...
  }

  #determineIsRoot(opts: CliffApp.CmdOptions): boolean {
    switch (this.#mode) {
      case CommandMode.ROOT: return true;
      case CommandMode.SUBCOMMAND: return false;
      case CommandMode.AUTO:
        // Auto-detect: check for subcommand marker in options
        return !opts._isSubcommand;
    }
  }

  /**
   * Split setupOptions into two phases.
   */
  protected setupOptions(): void {
    // 1. Setup command-specific options
    this.setupCommandOptions();
    
    // 2. Add logging options only for root commands
    if (this.#shouldAddLoggingOptions()) {
      CliffApp.addLoggingOptions(this.cmd, this.ctx);
    }
  }

  /**
   * Override this instead of setupOptions for command-specific options.
   */
  protected setupCommandOptions(): void {
    // Existing setupOptions logic moves here
    // ... existing implementation ...
  }

  #shouldAddLoggingOptions(): boolean {
    return this.#isRoot || this.#mode === CommandMode.ROOT;
  }

  /**
   * Enhanced action setup with conditional logging configuration.
   */
  protected setupAction(): void {
    if (this.node?.action) {
      this.cmd.action(async (opts: unknown, ...args: unknown[]) => {
        // Configure logging only for root commands
        if (this.#shouldConfigureLogging()) {
          CliffApp.configureLogging(this.ctx, opts as CliffApp.CmdOptions);
        }
        
        await this.node!.action!(this.ctx, opts as CliffApp.CmdOptions, ...args);
      });
    }
  }

  #shouldConfigureLogging(): boolean {
    return this.#isRoot || this.#mode === CommandMode.ROOT;
  }
}

// 3. Enhanced subcommand registration to mark subcommands

// In the init() method, when registering subcommands:
for (const [name, Entry] of Object.entries(subCommands)) {
  let child: Command<Context>;
  if (typeof Entry === 'function') {
    child = new (Entry as new () => Command<Context>)();
  } else {
    child = new Command(Entry as CliffApp.CommandNode<Context>);
  }

  if (this.#ctx) {
    // Mark as subcommand when setting context
    const subcommandOpts = { ...opts, _isSubcommand: true };
    await child.setContext(this.#ctx, subcommandOpts);
  }
  
  await child.init();
  this.children.push(child);
  this.cmd.command(name, child.cmd);
}

// 4. Usage Examples

// As root command (fsdate standalone):
const rootCmd = new FsdateRootCommand()
  .setMode(CommandMode.ROOT); // Explicit root mode
await rootCmd.setContext(ctx);

// As subcommand (fsdate in fs):
const subCmd = new FsdateRootCommand()
  .setMode(CommandMode.SUBCOMMAND); // Explicit subcommand mode
await subCmd.setContext(parentCtx, { _isSubcommand: true });

// Auto-detection (recommended):
const cmd = new FsdateRootCommand(); // Uses AUTO mode
await cmd.setContext(ctx, opts); // Auto-detects based on _isSubcommand marker
