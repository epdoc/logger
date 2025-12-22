export { Command } from './command.ts';
export { run } from './run.ts';
export * from './types.ts';
export { commaList, configureLogging } from './utils.ts';

// Declarative API
export {
  createApp,
  defineCommand,
  defineRootCommand,
  option,
  type CommandDefinition,
  type DeclarativeCommand,
  type DeclarativeRootCommand,
  type InferredOptions,
  type RootCommandDefinition,
} from './declarative.ts';

// Re-export commander itself for convenience
export * as Commander from 'commander';
