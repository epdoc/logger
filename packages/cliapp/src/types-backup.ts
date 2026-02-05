/**
 * @file Core types and interfaces for CLI application development
 * @description Clean type definitions for CliApp v2.0
 * @module
 */

import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import type { Dict } from '@epdoc/type';

// Clean imports
export type { Context, ICtx } from './context.ts';

/**
 * Package metadata structure from deno.json
 */
export type DenoPkg = {
  name: string;
  version: string;
  description: string;
  author?: { name?: string; email?: string };
  workspace?: string[];
  license?: string;
  repository?: { type: string; url: string };
};

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
export interface Opts extends CmdOptions {
  /** Verbose logging mode */
  verbose?: boolean;
  /** Debug logging mode */
  debug?: boolean;
  /** Dry-run mode (no actual changes) */
  dryRun?: boolean;
  /** Log level threshold */
  log?: string;
  /** Log display options */
  logShow?: string;
}

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
