/**
 * @file Core types and interfaces for CLI application development
 * @description Centralizes type definitions for package metadata, loggers, application context,
 * and command-line options, ensuring consistency and type safety across the CLI framework.
 * @module
 */

import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import type { Dict } from '@epdoc/type';

// Clean imports - no more complex context folder
export type { Context, ICtx } from './context.ts';

/**
 * Base message builder type for CLI applications
 *
 * All custom message builders should extend Console.Builder to ensure
 * compatibility with the CLI framework's logging system.
 */
export type MsgBuilder = Console.Builder;

/**
 * Generic logger type that works with custom message builders
 *
 * @template M - Message builder type extending MsgBuilder
 *
 * @example
 * ```typescript
 * type MyLogger = Logger<MyCustomBuilder>;
 * ```
 */
export type Logger<M extends MsgBuilder = MsgBuilder> = Log.Std.Logger<M>;

/**
 * Standard command-line options structure
 *
 * Defines the common CLI options that are automatically added by the framework,
 * including logging configuration and operational flags.
 *
 * @example
 * ```typescript
 * function configureApp(opts: Opts) {
 *   if (opts.verbose) {
 *     logMgr.threshold = 'debug';
 *   }
 *   if (opts.dryRun) {
 *     console.log('Running in dry-run mode');
 *   }
 * }
 * ```
 */
export type Opts = Partial<{
  /** Log level threshold (e.g., 'info', 'debug', 'error') */
  log: string;
  /** Array of log components to display (e.g., 'level', 'timestamp') */
  log_show: string[];
  /** Display color output */
  color: boolean;
  /** Show all available log components */
  showall: boolean;
  /** Enable verbose output */
  verbose: boolean;
  /** Enable debug mode */
  debug: boolean;
  /** Enable trace-level logging */
  trace: boolean;
  /** Enable spam-level logging (most verbose) */
  spam: boolean;
  /** Dry-run mode - show what would be done without executing */
  dryRun: boolean;
  /** Positional arguments passed to the command */
  args: string[];
}>;

/**
 * Error interface for silent failures
 *
 * Used to indicate errors that should not display stack traces
 * or verbose error information to the user.
 *
 * @example
 * ```typescript
 * const error = new Error('Validation failed') as ISilentError;
 * error.silent = true;
 * throw error;
 * ```
 */
export interface ISilentError extends Error {
  /** Flag indicating this error should be handled silently */
  silent: boolean;
}

// Enhanced types for CliffApp-style architecture

/** Command-line options dictionary */
export type CmdOptions = Dict;

/** Command-line arguments array */
export type CmdArgs = string[];

/**
 * Configuration for a single command-line option.
 */
export interface OptionConfig {
  /** The description of the option shown in the help menu. */
  description: string;
  /** The default value for the option. */
  default?: unknown;
  /** Whether the option is required. */
  required?: boolean;
  /** Whether the option should be hidden from the help menu. */
  hidden?: boolean;
  /** Whether the option can be specified multiple times to collect values. */
  collect?: boolean;
}

/**
 * A mapping of option flags to their descriptions or configurations.
 */
export type OptionsMap = Record<string, string | OptionConfig>;

/**
 * Declarative command node configuration for pure configuration-based commands
 */
export interface CommandNode<Context extends ICtx = ICtx> {
  /** Command name */
  name: string;
  /** Command description */
  description?: string;
  /** Command aliases */
  aliases?: string[];
  /** Command options */
  options?: OptionsMap;
  /** Command arguments */
  arguments?: string[];
  /** Command action handler */
  action?: (ctx: Context, opts: CmdOptions, ...args: CmdArgs) => Promise<void> | void;
  /** Subcommands */
  subCommands?: Record<string, CommandConstructor<Context> | CommandNode<Context>>;
}

/**
 * Constructor type for Command classes
 */
export interface CommandConstructor<Context extends ICtx = ICtx> {
  new (node?: CommandNode<Context>): Command<Context>;
}
