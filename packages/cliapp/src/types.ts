/**
 * @file Core types and interfaces for CLI application development
 * @description Clean type definitions for CliApp v2.0
 * @module
 */

import type { Dict } from '@epdoc/type';
import type * as Cmd from './cmd/mod.ts';
import type * as Ctx from './context.ts';
import type { CmdMetadata } from './pkg-type.ts';

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
  logLevel?: string;
  /** Shortcut to set logLevel to verbose */
  verbose?: boolean;
  /** Shortcut to set logLevel to debug */
  debug?: boolean;
  /** Shortcut to set logLevel to trace */
  trace?: boolean;
  /** Shortcut to set logLevel to spam (the lowest log level) */
  spam?: boolean;
  /** Array of log properties to display (e.g., 'level', 'timestamp'). Empty shows only the message.  */
  logShow?: string[] | boolean | undefined;
  /** Show all available log properties */
  logShowAll?: boolean;
  /** Display color output */
  color?: boolean;
  /** Disable color output */
  noColor?: boolean;
  /** Dry-run mode - show what would be done without executing */
  dryRun?: boolean;
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
  argParser?: (val: string) => unknown;
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

export type CmdParams = Partial<CmdMetadata> & {
  root?: boolean;
  dryRun?: boolean;
  aliases?: string[];
};

/**
 * Position for help text injection
 */
export type AddHelpTextPosition = 'beforeAll' | 'before' | 'after' | 'afterAll';

/**
 * Configuration for adding custom help text
 */
export interface HelpTextConfig {
  text: string;
  position?: AddHelpTextPosition;
}

/**
 * Declarative command node configuration for configuration-based commands
 */
export interface CommandNode<
  TContext extends Ctx.AbstractBase = Ctx.AbstractBase,
  TOpts extends CmdOptions = CmdOptions,
> {
  /** Command name (optional if provided via CmdParams) */
  name?: string;
  /** Command description */
  description?: string;
  /** Command version */
  version?: string;
  /** Command aliases */
  aliases?: string[];
  /** Command options */
  options?: OptionsMap;
  /** Command arguments */
  arguments?: string[];
  /** Custom help text to display */
  helpText?: HelpTextConfig[];
  /** Command action handler */
  action?(ctx: TContext, opts: TOpts, args: CmdArgs): Promise<void> | void;
  /** Context creation function for transforming parent context to child context. Options can be
   * applied to context here, or in hydrateContext, or in action */
  createContext?(ctx: TContext, opts: TOpts, args: CmdArgs): Promise<TContext> | TContext;
  /** Hydrate context with parsed options */
  hydrateContext?(ctx: TContext, opts: TOpts): void;
  /** Subcommands */
  // See packages/cliapp/DESIGN.md
  // deno-lint-ignore no-explicit-any
  subCommands?: Record<string, CommandConstructor<TContext> | CommandNode<any, any>>;
}

/**
 * Constructor type for Command classes
 */
export interface CommandConstructor<TContext extends Ctx.AbstractBase = Ctx.AbstractBase> {
  // See packages/cliapp/DESIGN.md
  // deno-lint-ignore no-explicit-any
  new (initialContext?: TContext): Cmd.AbstractBase<any, TContext>;
}
