/**
 * @file Declarative API types and interfaces
 * @description Type definitions for the declarative command API, providing a clean,
 * type-safe way to define CLI commands with arguments and options.
 * @module
 */

import type * as Ctx from '../context/mod.ts';
import type * as Option from './option/mod.ts';

/**
 * Valid parsed option value types from Commander.js
 * 
 * These are the primitive types that Commander.js can parse from command-line arguments.
 */
export type ParseOptionValue = string | number | boolean | string[] | number[];

/**
 * Parsed command-line options as key-value pairs
 * 
 * This represents the final parsed options object passed to command actions,
 * where keys are option names and values are the parsed primitive types.
 * 
 * @example
 * ```typescript
 * // For options: --count 5 --verbose --tags a,b,c
 * const opts: ParsedOptions = {
 *   count: 5,
 *   verbose: true,
 *   tags: ['a', 'b', 'c']
 * };
 * ```
 */
export type ParsedOptions = Record<string, ParseOptionValue>;

/**
 * Command argument definition
 * 
 * Defines a single command argument with its properties and behavior.
 * Arguments are positional parameters that come before options.
 * 
 * @example
 * ```typescript
 * // Required single argument: <file>
 * { name: 'file', description: 'Input file', required: true }
 * 
 * // Optional argument: [output]
 * { name: 'output', description: 'Output file', required: false }
 * 
 * // Variadic argument: <files...>
 * { name: 'files', description: 'Input files', variadic: true }
 * ```
 */
export interface ArgumentDefinition {
  /** Argument name (used in help text and error messages) */
  name: string;
  /** Human-readable description for help text */
  description: string;
  /** Whether this argument is required (default: true for single, false for variadic) */
  required?: boolean;
  /** Whether this argument accepts multiple values (creates <name...> syntax) */
  variadic?: boolean;
}

/**
 * Command definition using separate declaration pattern
 * 
 * Defines a complete command with its metadata, arguments, options, and action handler.
 * Uses the separate declaration pattern where users define option objects separately
 * and provide their own TypeScript interfaces for type safety.
 * 
 * @example
 * ```typescript
 * const processCmd: CommandDefinition = {
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
 *     // ctx: Ctx.IBase, args: string[], opts: ParsedOptions
 *     const { output, verbose } = opts as { output: string; verbose: boolean };
 *     // Implementation here
 *   }
 * };
 * ```
 */
export interface CommandDefinition {
  /** Command name (used for invocation) */
  name: string;
  /** Human-readable description for help text */
  description: string;
  /** Optional command arguments (positional parameters) */
  arguments?: ArgumentDefinition[];
  /** Command-specific options (includes root options when merged by Commander.js) */
  options?: Record<string, Option.Base>;
  /** 
   * Command action handler
   * 
   * @param ctx - Application context implementing Ctx.IBase
   * @param args - Parsed command arguments as string array
   * @param opts - Parsed options as key-value object
   */
  action: (ctx: Ctx.IBase, args: string[], opts: ParsedOptions) => Promise<void>;
}

/**
 * Root command definition extending CommandDefinition
 * 
 * Root commands can have subcommands and serve as the entry point for CLI applications.
 * They inherit all properties from CommandDefinition and add subcommand management.
 * Logger options are added separately via cmd.addLogging() in the framework.
 * 
 * @example
 * ```typescript
 * const app: RootCommandDefinition = {
 *   name: 'my-cli',
 *   description: 'My CLI application',
 *   arguments: [
 *     { name: 'command', description: 'Command to run', required: false }
 *   ],
 *   options: {
 *     config: new StringOption('--config <file>', 'Config file'),
 *     verbose: new BooleanOption('--verbose', 'Verbose output')
 *   },
 *   commands: {
 *     process: processCommand,
 *     deploy: deployCommand
 *   },
 *   async action(ctx, args, opts) {
 *     // Root command action (runs when no subcommand specified)
 *   }
 * };
 * ```
 */
export interface RootCommandDefinition extends CommandDefinition {
  /** 
   * Subcommands available under this root command
   * 
   * Keys are command names, values are command interfaces that can be built
   * into Commander.js commands.
   */
  commands?: Record<string, DeclarativeCommandInterface>;
}

/**
 * Interface for declarative commands to avoid circular imports
 * 
 * This minimal interface allows type checking without importing the full
 * DeclarativeCommand class, preventing circular dependency issues.
 * 
 * @example
 * ```typescript
 * class MyCommand implements DeclarativeCommandInterface {
 *   definition: CommandDefinition;
 *   
 *   build(ctx: Ctx.IBase, pkg?: DenoPkg): Command {
 *     // Build Commander.js command from definition
 *   }
 * }
 * ```
 */
export interface DeclarativeCommandInterface {
  /** The command definition containing metadata and action */
  definition: CommandDefinition;
  /** 
   * Optional build method to convert definition to Commander.js command
   * 
   * @param ctx - Application context
   * @param pkg - Optional package metadata
   * @returns Built Commander.js command
   */
  build?(ctx: Ctx.IBase, pkg?: unknown): unknown;
}
