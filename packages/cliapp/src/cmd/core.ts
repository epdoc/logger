import type { Command } from '../command.ts';
import type * as Ctx from '../context/mod.ts';
import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';

/**
 * Type bundle for context, message builder, and logger types
 */
export type ContextBundle<
  Context,
  MsgBuilder,
  Logger
> = {
  Context: Context;
  MsgBuilder: MsgBuilder;
  Logger: Logger;
};

/**
 * Abstract base class with common command setup functionality
 *
 * @template Bundle - Bundled context types
 * @template TOptions - Command options type for the action
 */
export abstract class BaseCmdCore<
  Bundle extends ContextBundle<unknown, unknown, unknown>,
  TOptions = unknown
> {
  protected cmd!: Command; // Definite assignment assertion - subclasses will set this
  protected ctx: Bundle['Context'];

  constructor(ctx: Bundle['Context']) {
    this.ctx = ctx;
    // Subclasses will set this.cmd in their constructor
  }

  /**
   * Override to add command arguments
   * Called first during setup
   */
  protected addArguments(): void {
    // Override in subclass if arguments needed
  }

  /**
   * Override to add command options
   * Called after arguments
   */
  protected addOptions(): void {
    // Override in subclass to add options
  }

  /**
   * Override to add additional setup (help text, hooks, etc.)
   * Called last
   */
  protected addExtras(): void {
    // Override in subclass for additional setup
  }

  /**
   * Override to define the command action (optional for root commands)
   * @param args - Command arguments array
   * @param opts - Parsed local command options
   * @param cmd - Command instance providing:
   *   - cmd.opts() - Only local command options
   *   - cmd.optsWithGlobals() - Local + global/parent options combined
   *   - cmd.name() - Command name
   *   - cmd.args - Raw arguments array
   */
  protected executeAction?(args: string[], opts: TOptions, cmd: Command): Promise<void>;

  /**
   * Setup action handler if executeAction is defined
   */
  protected setupAction(): void {
    if (this.executeAction) {
      this.cmd.action(async (...argsAndOpts: unknown[]) => {
        const cmd = argsAndOpts.pop() as Command;
        const opts = argsAndOpts.pop() as TOptions;
        const rawArgs = argsAndOpts as string[];
        
        // Flatten args to handle Commander.js variadic argument nesting
        const args = rawArgs.flat();

        await this.executeAction!(args, opts, cmd);
      });
    }
  }
}
