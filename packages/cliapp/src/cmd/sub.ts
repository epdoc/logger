import { Command } from '../command.ts';
import type * as Ctx from '../context/mod.ts';
import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import { BaseCmdCore, type ContextBundle } from './core.ts';

/**
 * Generic base class for CLI subcommands with structured setup
 *
 * @template Bundle - Bundled context types
 * @template TOptions - Command options type for the action
 */
export abstract class BaseCmd<
  Bundle extends ContextBundle<unknown, unknown, unknown>,
  TOptions = unknown
> extends BaseCmdCore<Bundle, TOptions> {
  constructor(
    ctx: Bundle['Context'],
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
