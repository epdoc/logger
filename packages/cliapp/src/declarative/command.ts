import { Command } from '../command.ts';
import type { DenoPkg, ICtx, Logger, MsgBuilder } from '../types.ts';
import * as Option from './option/mod.ts';
import type { CommandDefinition, InferredOptions } from './types.ts';

/**
 * Declarative command wrapper
 */
export class DeclarativeCommand<TOptions extends Record<string, Option.Base> = Record<PropertyKey, never>> {
  constructor(public definition: CommandDefinition<TOptions>) {}

  build<M extends MsgBuilder, L extends Logger<M>>(
    ctx: ICtx<M, L>,
    pkg?: DenoPkg,
  ): Command<M, L> {
    const cmd = new Command<M, L>(pkg!);
    cmd.name(this.definition.name);
    cmd.description(this.definition.description);

    // Add options
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

        // Add custom parser if needed
        if (!(optionDef instanceof Option.String)) {
          commanderOption.argParser((value: string) => optionDef.parse(value));
        }

        cmd.addOption(commanderOption);
      }
    }

    // Set up action - ctx is compatible with IBaseCtx since ICtx extends IBaseCtx
    cmd.action(async (rawOpts: Record<string, unknown>) => {
      const typedOpts = this.#parseOptions(rawOpts);
      await this.definition.action(typedOpts, ctx);
    });

    return cmd;
  }

  #parseOptions(rawOpts: Record<string, unknown>): InferredOptions<TOptions> {
    const parsed: Record<string, unknown> = {};

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

    return parsed as InferredOptions<TOptions>;
  }
}
