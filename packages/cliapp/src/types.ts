/**
 * @file Core types and interfaces for CLI application development
 * @description Centralizes type definitions for package metadata, loggers, application context,
 * and command-line options, ensuring consistency and type safety across the CLI framework.
 * @module
 */

import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';

/**
 * Package metadata structure from deno.json
 *
 * @example
 * ```typescript
 * import pkg from './deno.json' with { type: 'json' };
 * const context = new AppContext(pkg);
 * ```
 */
export type DenoPkg = {
  /** Package name */
  name: string;
  /** Semantic version string */
  version: string;
  /** Package description */
  description: string;
  /** Optional author information */
  author?: { name?: string; email?: string };
  /** Workspace configuration for monorepos */
  workspace?: string[];
  /** License identifier */
  license?: string;
  /** Repository information */
  repository?: {
    type: string;
    url: string;
  };
};

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
 * Application context interface for CLI applications
 *
 * Provides the core structure that all CLI contexts must implement,
 * including logging capabilities, package metadata, and lifecycle management.
 *
 * @template M - Message builder type
 * @template L - Logger type
 *
 * @example
 * ```typescript
 * class AppContext implements ICtx<MyBuilder, MyLogger> {
 *   log: MyLogger;
 *   logMgr: Log.Mgr<MyBuilder>;
 *   dryRun = false;
 *   pkg: DenoPkg;
 *
 *   async close() {
 *     await this.logMgr.close();
 *   }
 * }
 * ```
 */
export interface ICtx<
  M extends MsgBuilder = MsgBuilder,
  L extends Logger<M> = Logger<M>,
> {
  /** Logger instance for application output */
  log: L;
  /** Log manager for configuration and lifecycle */
  logMgr: Log.Mgr<M>;
  /** Flag indicating dry-run mode (no actual changes) */
  dryRun: boolean;
  /** Package metadata from deno.json */
  pkg: DenoPkg;
  /** Cleanup method called when application exits */
  close: () => Promise<void>;
}

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
