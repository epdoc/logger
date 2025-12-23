import { Command } from '../command.ts';
import type * as Ctx from '../context/mod.ts';
import type { DenoPkg } from '../types.ts';
import * as Option from './option/mod.ts';
import type { CommandDefinition, ParsedOptions } from './types.ts';

/**
 * Declarative command wrapper
 */
export class DeclarativeCommand {
  definition: CommandDefinition;

  constructor(definition: CommandDefinition) {
    this.definition = definition;
  }

  build(ctx: Ctx.IBase, pkg?: DenoPkg): Command {
    const cmd = new Command(pkg!);
    cmd.name(this.definition.name);
    cmd.description(this.definition.description);

    // Add arguments
    if (this.definition.arguments) {
      for (const argDef of this.definition.arguments) {
        const argName = argDef.variadic
          ? `<${argDef.name}...>`
          : argDef.required !== false
          ? `<${argDef.name}>`
          : `[${argDef.name}]`;
        cmd.argument(argName, argDef.description);
      }
    }

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

    // Set up action
    cmd.action(async (...argsAndOpts: unknown[]) => {
      // Commander.js passes arguments first, then options as last parameter
      const rawOpts = argsAndOpts.pop() as Record<string, unknown>;
      const args = argsAndOpts as string[];

      const parsedOpts = this.#parseOptions(rawOpts);
      await this.definition.action(ctx, args, parsedOpts);
    });

    return cmd;
  }

  #parseOptions(rawOpts: Record<string, unknown>): ParsedOptions {
    const parsed: ParsedOptions = {};

    if (this.definition.options) {
      for (const [key, optionDef] of Object.entries(this.definition.options)) {
        const rawValue = rawOpts[key];
        if (rawValue !== undefined) {
          parsed[key] = optionDef instanceof Option.String
            ? rawValue as string
            : optionDef.parse(rawValue as string) as string | number | boolean | string[] | number[];
        } else if (optionDef.getDefault() !== undefined) {
          parsed[key] = optionDef.getDefault() as string | number | boolean | string[] | number[];
        }
      }
    }

    return parsed;
  }
}
