// Re-export types
export { DeclarativeCommand as Command } from './command.ts';
export { option } from './consts.ts';
export * from './helpers.ts';
export * as Option from './option/mod.ts';
export { DeclarativeRootCommand as RootCommand } from './root-command.ts';
export type { ArgumentDefinition, CommandDefinition, RootCommandDefinition } from './types.ts';
