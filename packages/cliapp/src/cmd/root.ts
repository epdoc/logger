import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import { Command } from '../command.ts';
import type * as Ctx from '../context/mod.ts';
import type { DenoPkg, ICtx } from '../types.ts';
import { BaseCmdCore, type ContextBundle } from './core.ts';

/**
 * Generic base class for CLI root commands with structured setup
 *
 * @template Bundle - Bundled context types
 * @template TOptions - Root command options type for the action
 */
export class BaseRootCmd<
  Bundle extends ContextBundle<unknown, unknown, unknown>,
  TOptions = unknown
> extends BaseCmdCore<Bundle, TOptions> {
  constructor(
    ctx: Bundle['Context'],
    pkg: DenoPkg,
  ) {
    super(ctx);

    // For root commands, use the full package metadata
    this.cmd = new Command(pkg);
  }

  /**
   * Override to add subcommands
   * Called after options, before extras
   */
  protected async addCommands(): Promise<void> {
    // Override in subclass to add subcommands
  }

  /**
   * Initialize the root command with proper setup order
   */
  async init(): Promise<Command> {
    // Initialize with context - type assertion for compatibility
    (this.cmd as Command).init(this.ctx as unknown as ICtx);

    // Setup in correct order
    this.addArguments();
    this.addOptions();
    await this.addCommands(); // Root commands add subcommands
    this.addExtras();
    this.setupAction(); // Optional for root commands

    return this.cmd;
  }
}
