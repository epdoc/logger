/**
 * @file Defines the core types and interfaces used throughout the CLI application.
 * @description This module centralizes the type definitions for package information, loggers, application context,
 * and command-line options, ensuring consistency and type safety.
 * @module
 */

import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';

/**
 * Represents the structure of the `deno.json` package metadata.
 */
export type DenoPkg = {
  name: string;
  version: string;
  description: string;
  workspace?: string[];
};

/**
 * The base message builder that all custom builders for this library must extend.
 */
export type MsgBuilder = Console.Builder;

/**
 * A generic Logger type that accepts a custom MsgBuilder.
 */
export type Logger<M extends MsgBuilder = MsgBuilder> = Log.Std.Logger<M>;

/**
 * A generic Interface for the application context.
 */
export interface ICtx<
  M extends MsgBuilder = MsgBuilder,
  L extends Logger<M> = Logger<M>,
> {
  log: L;
  logMgr: Log.Mgr<M>;
  dryRun: boolean;
  close: () => Promise<void>;
}

/**
 * Defines the structure of the parsed command-line options.
 * This type includes options for logging, verbosity, and other common CLI flags.
 */
export type Opts = Partial<{
  /** The log level (e.g., 'info', 'debug', 'error'). */
  log: string;
  /** An array of strings specifying which log components to show (e.g., 'level', 'timestamp'). */
  log_show: string[];
  /** A flag to show all log components. */
  showall: boolean;
  /** A flag to enable verbose output, if supported by the logger. */
  verbose: boolean;
  /** A flag to enable debug mode. */
  debug: boolean;
  /** A flag to enable trace-level logging. */
  trace: boolean;
  /** A flag to enable spam-level logging. */
  spam: boolean;
  /** A flag to indicate if the application is running in test mode. */
  dryRun: boolean;
  /** An array of positional arguments passed to the command. */
  args: string[];
}>;

export interface ISilentError extends Error {
  silent: boolean;
}
