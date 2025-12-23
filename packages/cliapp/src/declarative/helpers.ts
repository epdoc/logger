/**
 * @file Declarative API helper functions
 * @description Factory functions and utilities for creating and running CLI applications
 * using the declarative command API with the separate declaration pattern.
 * @module
 */

import type * as Ctx from '../context/mod.ts';
import type { DenoPkg } from '../types.ts';
import { DeclarativeCommand } from './command.ts';
import { DeclarativeRootCommand } from './root-command.ts';
import type { CommandDefinition, RootCommandDefinition } from './types.ts';

/**
 * Creates a declarative command from a command definition
 * 
 * Factory function that wraps a CommandDefinition in a DeclarativeCommand class,
 * enabling it to be built into a Commander.js command. Uses the separate declaration
 * pattern where users define option objects and provide their own TypeScript interfaces.
 * 
 * @param definition - Complete command definition with metadata and action
 * @returns DeclarativeCommand instance ready to be built or used in a root command
 * 
 * @example
 * ```typescript
 * const processCmd = defineCommand({
 *   name: 'process',
 *   description: 'Process input files',
 *   arguments: [
 *     { name: 'files', description: 'Files to process', variadic: true }
 *   ],
 *   options: {
 *     output: new StringOption('--output <dir>', 'Output directory'),
 *     verbose: new BooleanOption('--verbose', 'Verbose output')
 *   },
 *   async action(ctx, args, opts) {
 *     // Implementation here
 *   }
 * });
 * ```
 */
export function defineCommand(
  definition: CommandDefinition,
): DeclarativeCommand {
  return new DeclarativeCommand(definition);
}

/**
 * Creates a declarative root command from a root command definition
 * 
 * Factory function that wraps a RootCommandDefinition in a DeclarativeRootCommand class,
 * enabling it to serve as the entry point for a CLI application. Root commands can
 * contain subcommands and serve as the main application interface.
 * 
 * @param definition - Complete root command definition with metadata, subcommands, and action
 * @returns DeclarativeRootCommand instance ready to be run with createApp()
 * 
 * @example
 * ```typescript
 * const app = defineRootCommand({
 *   name: 'my-cli',
 *   description: 'My CLI application',
 *   options: {
 *     config: new StringOption('--config <file>', 'Config file'),
 *     verbose: new BooleanOption('--verbose', 'Verbose output')
 *   },
 *   commands: {
 *     process: processCommand,
 *     deploy: deployCommand
 *   },
 *   async action(ctx, args, opts) {
 *     // Root command action (when no subcommand specified)
 *   }
 * });
 * ```
 */
export function defineRootCommand(
  definition: RootCommandDefinition,
): DeclarativeRootCommand {
  return new DeclarativeRootCommand(definition);
}

/**
 * Creates and runs a CLI application from a root command
 * 
 * Main entry point for declarative CLI applications. Handles the complete lifecycle:
 * context creation, command building, argument parsing, action execution, and cleanup.
 * Automatically processes Deno.args and manages application context lifecycle.
 * 
 * @param rootCommand - Root command created with defineRootCommand()
 * @param createContext - Factory function that creates the application context
 * 
 * @example
 * ```typescript
 * // Basic usage
 * if (import.meta.main) {
 *   await createApp(app, () => new AppContext());
 * }
 * 
 * // With error handling
 * if (import.meta.main) {
 *   try {
 *     await createApp(app, () => new AppContext());
 *   } catch (error) {
 *     console.error('Application failed:', error.message);
 *     Deno.exit(1);
 *   }
 * }
 * ```
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
