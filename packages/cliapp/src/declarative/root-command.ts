import { Command } from '../command.ts';
import type { DenoPkg, ICtx, Logger, MsgBuilder, Opts } from '../types.ts';
import { configureLogging } from '../utils.ts';
import * as Option from './option/mod.ts';
import type { InferredOptions, RootCommandDefinition } from './types.ts';

/**
 * Root command wrapper
 */
export class DeclarativeRootCommand<
  TOptions extends Record<string, Option.Base> = Record<PropertyKey, never>,
  TGlobalOptions extends Record<string, Option.Base> = Record<PropertyKey, never>,
> {
  constructor(public definition: RootCommandDefinition<TOptions, TGlobalOptions>) {}

  build<M extends MsgBuilder, L extends Logger<M>>(
    ctx: ICtx<M, L>,
    pkg?: DenoPkg,
  ): Command<M, L> {
    const cmd = new Command<M, L>(pkg ?? { name: '', version: '0.0.0', description: '' });
    cmd.init(ctx);

    // Add subcommands first
    if (this.definition.subcommands) {
      for (const subCmd of this.definition.subcommands) {
        const builtSubCmd = subCmd.build(ctx, pkg) as Command<M, L>;
        cmd.addCommand(builtSubCmd);
      }
    }

    // Add global options (apply to all subcommands)
    if (this.definition.globalOptions) {
      for (const [_key, optionDef] of Object.entries(this.definition.globalOptions)) {
        const commanderOption = cmd.createOption(optionDef.flags, optionDef.description);

        if (optionDef.getDefault() !== undefined) {
          commanderOption.default(optionDef.getDefault());
        }

        if (optionDef.isRequired()) {
          commanderOption.makeOptionMandatory();
        }

        if (optionDef.getChoices()) {
          commanderOption.choices(optionDef.getChoices() as string[]);
        }

        if (!(optionDef instanceof Option.String)) {
          commanderOption.argParser((value: string) => optionDef.parse(value));
        }

        cmd.addOption(commanderOption);
      }
    }

    // Add root-specific options
    if (this.definition.options) {
      for (const [_key, optionDef] of Object.entries(this.definition.options)) {
        const commanderOption = cmd.createOption(optionDef.flags, optionDef.description);

        if (optionDef.getDefault() !== undefined) {
          commanderOption.default(optionDef.getDefault());
        }

        if (optionDef.isRequired()) {
          commanderOption.makeOptionMandatory();
        }

        if (optionDef.getChoices()) {
          commanderOption.choices(optionDef.getChoices() as string[]);
        }

        if (!(optionDef instanceof Option.String)) {
          commanderOption.argParser((value: string) => optionDef.parse(value));
        }

        cmd.addOption(commanderOption);
      }
    }

    // Set up preAction hook for logging configuration
    cmd.hook('preAction', (command: unknown, _actionCommand: unknown) => {
      const opts = (command as { opts(): Opts }).opts();
      configureLogging(ctx, opts);
    });

    // Add logging options (these appear last)
    cmd.addLogging(ctx);

    // Set up root action if provided
    if (this.definition.action) {
      cmd.action(async (rawOpts: Record<string, unknown>) => {
        const typedOpts = this.#parseOptions(rawOpts);
        await this.definition.action!(typedOpts, ctx);
      });
    }

    return cmd;
  }

  #parseOptions(rawOpts: Record<string, unknown>): InferredOptions<TOptions & TGlobalOptions> {
    const parsed: Record<string, unknown> = {};

    // Parse global options
    if (this.definition.globalOptions) {
      for (const [_key, optionDef] of Object.entries(this.definition.globalOptions)) {
        const rawValue = rawOpts[_key];
        if (rawValue !== undefined) {
          parsed[_key] = optionDef instanceof Option.String ? rawValue : optionDef.parse(rawValue as string);
        } else if (optionDef.getDefault() !== undefined) {
          parsed[_key] = optionDef.getDefault();
        }
      }
    }

    // Parse root options
    if (this.definition.options) {
      for (const [_key, optionDef] of Object.entries(this.definition.options)) {
        const rawValue = rawOpts[_key];
        if (rawValue !== undefined) {
          parsed[_key] = optionDef instanceof Option.String ? rawValue : optionDef.parse(rawValue as string);
        } else if (optionDef.getDefault() !== undefined) {
          parsed[_key] = optionDef.getDefault();
        }
      }
    }

    return parsed as InferredOptions<TOptions & TGlobalOptions>;
  }
}
