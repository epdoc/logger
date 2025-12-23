import { Command } from '../command.ts';
import type * as Ctx from '../context/mod.ts';
import type { DenoPkg, Opts } from '../types.ts';
import { configureLogging } from '../utils.ts';
import * as Option from './option/mod.ts';
import type { ParsedOptions, RootCommandDefinition } from './types.ts';

/**
 * Root command wrapper
 */
export class DeclarativeRootCommand {
  definition: RootCommandDefinition;

  constructor(definition: RootCommandDefinition) {
    this.definition = definition;
  }

  build(ctx: Ctx.IBase, pkg?: DenoPkg): Command {
    const cmd = new Command(pkg ?? { name: '', version: '0.0.0', description: '' });
    cmd.init(ctx);

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

    // Add subcommands first
    if (this.definition.commands) {
      for (const [_name, subCmd] of Object.entries(this.definition.commands)) {
        const builtSubCmd = subCmd.build?.(ctx, pkg) ?? subCmd.definition;
        cmd.addCommand(builtSubCmd as Command);
      }
    }

    // Add root options (available to all subcommands)
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
      cmd.action(async (...argsAndOpts: unknown[]) => {
        // Commander.js passes arguments first, then options as last parameter
        const rawOpts = argsAndOpts.pop() as Record<string, unknown>;
        const args = argsAndOpts as string[];

        const parsedOpts = this.#parseOptions(rawOpts);
        await this.definition.action!(ctx, args, parsedOpts);
      });
    }

    return cmd;
  }

  #parseOptions(rawOpts: Record<string, unknown>): ParsedOptions {
    const parsed: ParsedOptions = {};

    // Parse root options
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
