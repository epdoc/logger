/**
 * @file Core types and interfaces for CLI application development
 * @description Clean type definitions for CliApp v2.0
 * @module
 */

import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import type { Dict } from '@epdoc/type';

// Clean imports - respecting circular dependency separation
export type { Context, ICtx } from './context.ts';
export type { DenoPkg } from './pkg-type.ts';
export type { BaseCommand } from './cmd-abstract.ts';

// Local imports for use in this file
import type { BaseCommand } from './cmd-abstract.ts';
import type { ICtx } from './context.ts';
import type { DenoPkg } from './pkg-type.ts';

/**
 * Base message builder type for CLI applications
 */
export type MsgBuilder = Console.Builder;

/**
 * Generic logger type
 */
export type Logger<M extends MsgBuilder = MsgBuilder> = Log.Std.Logger<M>;

/**
 * Command-line options dictionary
 */
export type CmdOptions = Dict;

/**
 * Command-line arguments array
 */
export type CmdArgs = string[];

/**
 * Standard CLI options structure
 */
export type LogOptions = CmdOptions & {
  /** Log level threshold (e.g., 'info', 'debug', 'error') */
  logLevel: string;
  /** Shortcut to set logLevel to verbose */
  verbose: boolean;
  /** Shortcut to set logLevel to debug */
  debug: boolean;
  /** Shortcut to set logLevel to trace */
  trace: boolean;
  /** Shortcut to set logLevel to spam (the lowest log level) */
  spam: boolean;
  /** Array of log properties to display (e.g., 'level', 'timestamp'). Empty shows only the message.  */
  logShow: string[] | boolean | undefined;
  /** Show all available log properties */
  logShowAll: boolean;
  /** Display color output */
  color: boolean;
  /** Dry-run mode - show what would be done without executing */
  dryRun: boolean;
};

/**
 * Configuration for a single command-line option
 */
export interface OptionConfig {
  description: string;
  default?: unknown;
  required?: boolean;
  hidden?: boolean;
  collect?: boolean;
}

/**
 * A mapping of option flags to their descriptions or configurations
 */
export type OptionsMap = Record<string, string | OptionConfig>;

/**
 * Error interface for silent failures
 */
export interface ISilentError extends Error {
  silent: boolean;
}

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
  /** Context refinement function for transforming parent context to child context */
  refineContext?: (ctx: Context, opts: CmdOptions, args: CmdArgs) => Promise<Context> | Context;
  /** Hydrate context with parsed options */
  hydrate?: (ctx: Context, opts: CmdOptions) => void;
  /** Subcommands */
  subCommands?: Record<string, CommandConstructor<Context> | CommandNode<Context>>;
}

/**
 * Constructor type for Command classes
 */
export interface CommandConstructor<Context extends ICtx = ICtx> {
  new (initialContext?: Context): BaseCommand<Context, Context>;
}
