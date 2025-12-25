import { Command } from '../command.ts';
import type * as Ctx from '../context/mod.ts';
import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import { BaseCmdCore } from './core.ts';

/**
 * Generic base class for CLI subcommands with structured setup
 *
 * @template Context - Context type extending Ctx.IBase
 * @template TOptions - Command options type for the action
 * @template MsgBuilder - Message builder type extending Console.Builder
 * @template Logger - Logger type extending Log.IEmitter
 */
export abstract class BaseCmd<
  Context extends Ctx.IBase<MsgBuilder, Logger>,
  TOptions = unknown,
  MsgBuilder extends Console.Builder = Console.Builder,
  Logger extends Log.IEmitter = Log.IEmitter,
> extends BaseCmdCore<Context, TOptions, MsgBuilder, Logger> {
  constructor(
    ctx: Context,
    name: string,
    description: string,
    aliases?: string[],
  ) {
    super(ctx);

    // For subcommands, create with basic metadata
    this.cmd = new Command({
      name: name,
      version: '0.0.0',
      description: description,
    });
    this.cmd.name(name).description(description);

    if (aliases) {
      aliases.forEach((alias) => this.cmd.alias(alias));
    }
  }

  /**
   * Subcommands must have an action
   */
  protected abstract override executeAction(args: string[], opts: TOptions, cmd: Command): Promise<void>;

  /**
   * Initialize the command with proper setup order
   */
  init(): Promise<Command> {
    this.addArguments();
    this.addOptions();
    this.addExtras();
    this.setupAction();

    return Promise.resolve(this.cmd);
  }
}
