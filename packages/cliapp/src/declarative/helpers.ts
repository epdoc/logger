import type { DenoPkg, ICtx, Logger, MsgBuilder } from '../types.ts';
import { DeclarativeCommand } from './command.ts';
import type * as Option from './option/mod.ts';
import { DeclarativeRootCommand } from './root-command.ts';
import type * as Declarative from './types.ts';

/**
 * Factory functions
 */
export function defineCommand<TOptions extends Record<string, Option.Base>>(
  definition: Declarative.CommandDefinition<TOptions>,
): DeclarativeCommand<TOptions> {
  return new DeclarativeCommand(definition);
}

export function defineRootCommand<
  TOptions extends Record<string, Option.Base> = Record<PropertyKey, never>,
  TGlobalOptions extends Record<string, Option.Base> = Record<PropertyKey, never>,
>(
  definition: Declarative.RootCommandDefinition<TOptions, TGlobalOptions>,
): DeclarativeRootCommand<TOptions, TGlobalOptions> {
  return new DeclarativeRootCommand(definition);
}

/**
 * App creation utility
 */
export async function createApp<M extends MsgBuilder, L extends Logger<M>>(
  rootCommand: DeclarativeRootCommand<Record<PropertyKey, never>, Record<PropertyKey, never>>,
  createContext: () => ICtx<M, L>,
): Promise<void> {
  const ctx = createContext();

  try {
    const cmd = rootCommand.build(ctx, (ctx as { pkg?: DenoPkg }).pkg);
    await cmd.parseAsync();
  } finally {
    await ctx.close();
  }
}
