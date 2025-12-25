import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import { Command } from '../command.ts';
import type * as Ctx from '../context/mod.ts';
import type { DenoPkg, ICtx } from '../types.ts';
import { BaseCmdCore } from './core.ts';

/**
 * Generic base class for CLI root commands with structured setup
 *
 * @template Context - Context type extending Ctx.IBase
 * @template TOptions - Root command options type for the action
 * @template MsgBuilder - Message builder type extending Console.Builder
 * @template Logger - Logger type extending Log.IEmitter
 */
export class BaseRootCmd<
  Context extends Ctx.IBase<MsgBuilder, Logger>,
  TOptions = unknown,
  MsgBuilder extends Console.Builder = Console.Builder,
  Logger extends Log.IEmitter = Log.IEmitter,
> extends BaseCmdCore<Context, TOptions, MsgBuilder, Logger> {
  constructor(
    ctx: Context,
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
