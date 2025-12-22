/**
 * @file Declarative command definition utilities
 * @description Provides a simplified, declarative API for defining CLI commands
 * @module
 */

import { Command } from './command.ts';
import type { DenoPkg, ICtx, Logger, MsgBuilder, Opts } from './types.ts';
import { configureLogging } from './utils.ts';

/**
 * Option definition helpers
 */
export const option = {
  string: (flags: string, description: string): StringOption => new StringOption(flags, description),
  number: (flags: string, description: string): NumberOption => new NumberOption(flags, description),
  boolean: (flags: string, description: string): BooleanOption => new BooleanOption(flags, description),
  date: (flags: string, description: string): DateOption => new DateOption(flags, description),
  path: (flags: string, description: string): PathOption => new PathOption(flags, description),
  array: (flags: string, description: string): ArrayOption => new ArrayOption(flags, description),
};

/**
 * Base option class
 */
abstract class BaseOption<T = unknown> {
  constructor(
    public flags: string,
    public description: string,
  ) {}

  private _default?: T;
  private _required = false;
  private _choices?: readonly string[];

  default(value: T): this {
    this._default = value;
    return this;
  }

  required(): this {
    this._required = true;
    return this;
  }

  choices(values: readonly string[]): this {
    this._choices = values;
    return this;
  }

  getDefault(): T | undefined {
    return this._default;
  }

  isRequired(): boolean {
    return this._required;
  }

  getChoices(): readonly string[] | undefined {
    return this._choices;
  }

  abstract parse(value: string): T;
}

class StringOption extends BaseOption<string> {
  parse(value: string): string {
    return value;
  }
}

class NumberOption extends BaseOption<number> {
  parse(value: string): number {
    const num = Number(value);
    if (isNaN(num)) throw new Error(`Invalid number: ${value}`);
    return num;
  }
}

class BooleanOption extends BaseOption<boolean> {
  parse(_value: string): boolean {
    return true; // Boolean flags are true when present
  }
}

class DateOption extends BaseOption<Date> {
  parse(value: string): Date {
    const date = new Date(value);
    if (isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
    return date;
  }
}

class PathOption extends BaseOption<string> {
  parse(value: string): string {
    return value; // Could add path validation here
  }
}

class ArrayOption extends BaseOption<string[]> {
  parse(value: string): string[] {
    return value.split(',').map(s => s.trim());
  }
}

/**
 * Command definition types
 */
export interface CommandDefinition<TOptions extends Record<string, BaseOption> = Record<PropertyKey, never>> {
  name: string;
  description: string;
  options?: TOptions;
  action: (opts: InferredOptions<TOptions>, ctx: ICtx) => Promise<void>;
}

export interface RootCommandDefinition<
  TOptions extends Record<string, BaseOption> = Record<PropertyKey, never>,
  TGlobalOptions extends Record<string, BaseOption> = Record<PropertyKey, never>
> {
  name: string;
  description: string;
  options?: TOptions;
  globalOptions?: TGlobalOptions;
  action?: (opts: InferredOptions<TOptions & TGlobalOptions>, ctx: ICtx) => Promise<void>;
  subcommands?: DeclarativeCommand<Record<PropertyKey, never>>[];
}

/**
 * Type to infer option types from option definitions
 */
export type InferredOptions<T extends Record<string, BaseOption>> = {
  [K in keyof T]: T[K] extends BaseOption<infer U> ? U : never;
};

/**
 * Declarative command wrapper
 */
export class DeclarativeCommand<TOptions extends Record<string, BaseOption> = Record<PropertyKey, never>> {
  constructor(public definition: CommandDefinition<TOptions>) {}

  build<M extends MsgBuilder, L extends Logger<M>>(
    ctx: ICtx<M, L>,
    pkg?: DenoPkg
  ): Promise<Command<M, L>> {
    const cmd = new Command<M, L>(pkg);
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
        if (!(optionDef instanceof StringOption)) {
          commanderOption.argParser((value: string) => optionDef.parse(value));
        }

        cmd.addOption(commanderOption);
      }
    }

    // Set up action
    cmd.action(async (rawOpts: unknown) => {
      const typedOpts = this.parseOptions(rawOpts);
      await this.definition.action(typedOpts, ctx);
    });

    return cmd;
  }

  private parseOptions(rawOpts: unknown): InferredOptions<TOptions> {
    const parsed: unknown = Record<PropertyKey, never>;
    
    if (this.definition.options) {
      for (const [_key, optionDef] of Object.entries(this.definition.options)) {
        const rawValue = rawOpts[key];
        if (rawValue !== undefined) {
          parsed[key] = optionDef instanceof StringOption ? rawValue : optionDef.parse(rawValue);
        } else if (optionDef.getDefault() !== undefined) {
          parsed[key] = optionDef.getDefault();
        }
      }
    }
    
    return parsed;
  }
}

/**
 * Root command wrapper
 */
export class DeclarativeRootCommand<
  TOptions extends Record<string, BaseOption> = Record<PropertyKey, never>,
  TGlobalOptions extends Record<string, BaseOption> = Record<PropertyKey, never>
> {
  constructor(public definition: RootCommandDefinition<TOptions, TGlobalOptions>) {}

  build<M extends MsgBuilder, L extends Logger<M>>(
    ctx: ICtx<M, L>,
    pkg?: DenoPkg
  ): Promise<Command<M, L>> {
    const cmd = new Command<M, L>(pkg);
    cmd.init(ctx);

    // Add subcommands first
    if (this.definition.subcommands) {
      for (const subCmd of this.definition.subcommands) {
        const builtSubCmd = subCmd.build(ctx, pkg);
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

        if (!(optionDef instanceof StringOption)) {
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

        if (!(optionDef instanceof StringOption)) {
          commanderOption.argParser((value: string) => optionDef.parse(value));
        }

        cmd.addOption(commanderOption);
      }
    }

    // Set up preAction hook for logging configuration
    cmd.hook('preAction', (command, _actionCommand) => {
      const opts = command.opts<Opts>();
      configureLogging(ctx, opts);
    });

    // Add logging options (these appear last)
    cmd.addLogging(ctx);

    // Set up root action if provided
    if (this.definition.action) {
      cmd.action(async (rawOpts: unknown) => {
        const typedOpts = this.parseOptions(rawOpts);
        await this.definition.action!(typedOpts, ctx);
      });
    }

    return cmd;
  }

  private parseOptions(rawOpts: unknown): InferredOptions<TOptions & TGlobalOptions> {
    const parsed: unknown = Record<PropertyKey, never>;
    
    // Parse global options
    if (this.definition.globalOptions) {
      for (const [_key, optionDef] of Object.entries(this.definition.globalOptions)) {
        const rawValue = rawOpts[key];
        if (rawValue !== undefined) {
          parsed[key] = optionDef instanceof StringOption ? rawValue : optionDef.parse(rawValue);
        } else if (optionDef.getDefault() !== undefined) {
          parsed[key] = optionDef.getDefault();
        }
      }
    }

    // Parse root options
    if (this.definition.options) {
      for (const [_key, optionDef] of Object.entries(this.definition.options)) {
        const rawValue = rawOpts[key];
        if (rawValue !== undefined) {
          parsed[key] = optionDef instanceof StringOption ? rawValue : optionDef.parse(rawValue);
        } else if (optionDef.getDefault() !== undefined) {
          parsed[key] = optionDef.getDefault();
        }
      }
    }
    
    return parsed;
  }
}

/**
 * Factory functions
 */
export function defineCommand<TOptions extends Record<string, BaseOption>>(
  definition: CommandDefinition<TOptions>
): DeclarativeCommand<TOptions> {
  return new DeclarativeCommand(definition);
}

export function defineRootCommand<
  TOptions extends Record<string, BaseOption> = Record<PropertyKey, never>,
  TGlobalOptions extends Record<string, BaseOption> = Record<PropertyKey, never>
>(
  definition: RootCommandDefinition<TOptions, TGlobalOptions>
): DeclarativeRootCommand<TOptions, TGlobalOptions> {
  return new DeclarativeRootCommand(definition);
}

/**
 * App creation utility
 */
export async function createApp<M extends MsgBuilder, L extends Logger<M>>(
  rootCommand: DeclarativeRootCommand<Record<PropertyKey, never>, Record<PropertyKey, never>>,
  createContext: () => ICtx<M, L>
): Promise<void> {
  const ctx = createContext();
  
  try {
    const cmd = rootCommand.build(ctx, ctx.pkg);
    await cmd.parseAsync();
  } finally {
    await ctx.close();
  }
}
