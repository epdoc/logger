import type * as Ctx from '../context/mod.ts';
import type { DenoPkg } from '../types.ts';
import { DeclarativeCommand } from './command.ts';
import { DeclarativeRootCommand } from './root-command.ts';
import type { CommandDefinition, RootCommandDefinition } from './types.ts';

/**
 * Factory functions using separate declaration pattern
 */
export function defineCommand(
  definition: CommandDefinition,
): DeclarativeCommand {
  return new DeclarativeCommand(definition);
}

export function defineRootCommand(
  definition: RootCommandDefinition,
): DeclarativeRootCommand {
  return new DeclarativeRootCommand(definition);
}

/**
 * App creation utility
 */
export async function createApp(
  rootCommand: DeclarativeRootCommand,
  createContext: () => Ctx.IBase,
): Promise<void> {
  const ctx = createContext();

  try {
    const cmd = rootCommand.build(ctx, (ctx as { pkg?: DenoPkg }).pkg);
    await cmd.parseAsync();
  } finally {
    await ctx.close();
  }
}
