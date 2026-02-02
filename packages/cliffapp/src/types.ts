import type { Command } from '@cliffy/command';
import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import type { AbstractCmd } from './abstract-cmd.ts';

/**
 * Standard message builder type for Cliffy applications.
 */
export type MsgBuilder = Console.Builder;

/**
 * Standard logger type for Cliffy applications.
 */
export type Logger<M extends MsgBuilder = MsgBuilder> = Log.Std.Logger<M>;

/**
 * Definition of a single command option.
 */
export type OptionDefinition = {
  /** Helpful description for the flag. */
  description: string;
  /** Default value for the option. */
  default?: unknown;
  /** Allowed values for the option. */
  choices?: (string | number)[];
  /** Whether the option is required. */
  required?: boolean;
  /** Whether the option should be hidden from help. */
  hidden?: boolean;
  /** Options that conflict with this one. */
  conflicts?: string[];
  /** Options that this one depends on. */
  depends?: string[];
  /** Whether the option can be specified multiple times. */
  collect?: boolean;
};

/**
 * Mapping of flags (e.g., "-f, --force") to descriptions or definitions.
 */
export type OptionsMap = Record<string, string | OptionDefinition>;
export type GenericOptions = Record<string, unknown>;

/**
 * Mapping of subcommand names to their nodes or AbstractCmd classes.
 */
export type CmdName = string;
export type SubCommandsRecord<Ctx extends ICtx = ICtx> = Record<
  CmdName,
  CommandNode<Ctx> | (new () => AbstractCmd<Ctx>)
>;

/**
 * Configuration for subcommands, can be a static map or a function that returns the map.
 */
export type SubCommandsConfig<Ctx extends ICtx = ICtx> =
  | SubCommandsRecord<Ctx>
  | ((ctx: Ctx) => SubCommandsRecord<Ctx>);

/**
 * A declarative node representing a command in the tree.
 */
export type CommandNode<Ctx extends ICtx = ICtx> = {
  /** Brief description of what the command does. */
  description: string;
  /** Version string for this specific command (usually for the root only). */
  version?: string;
  /** Positional arguments, e.g., "<id:string> [path:string]". */
  arguments?: string;
  /** Options can be a static map or a function that returns the map based on context. */
  options?: OptionsMap | ((ctx: Ctx) => OptionsMap);
  /** Recursive subcommands mapping names to their nodes or AbstractCmd classes. */
  subCommands?: SubCommandsConfig<Ctx>;
  /**
   * Optional hook to refine or transform the context for this node and its children.
   * Note: This is called during the declarative build phase. For refinement based
   * on parsed options, use `setupGlobalAction`.
   */
  refineContext?: (parentCtx: Ctx, opts: GenericOptions, args?: unknown[]) => Ctx;
  /** Hook to configure global actions (for context refinement based on opts). */
  setupGlobalAction?: (cmd: Command, ctx: Ctx) => void;
  /** The logic to execute when the command is run. */
  action?: (ctx: Ctx, opts: GenericOptions, ...args: unknown[]) => Promise<void> | void;
};

/**
 * Application context for Cliffy applications.
 */
export interface ICtx<
  M extends MsgBuilder = MsgBuilder,
  L extends Logger<M> = Logger<M>,
> {
  /** The logger instance for the application. */
  log: L;
  /** The log manager coordinating loggers and transports. */
  logMgr: Log.Mgr<M>;
  /** Whether the application is running in dry-run mode. */
  dryRun: boolean;
  /** Package information for the application. */
  // pkg: DenoPkg;
  /** Cleanup and shutdown logic for the application. */
  close: () => Promise<void>;
}

/**
 * Interface for errors that should not display stack traces.
 */
export interface ISilentError extends Error {
  /** If true, the run wrapper will only log the error message, not the stack trace. */
  silent: boolean;
}

/**
 * Standard CLI logging options.
 * These correspond to the flags added by `addLoggingOptions`.
 */
export interface GlobalLogOptions {
  /** Log threshold level (e.g., 'debug', 'info'). Maps to `--log`. */
  log?: string;
  /** Comma-separated log components to show. Maps to `--log-show`. */
  logShow?: string[];
  /** Whether to enable color in output. Maps to `--color` / `--no-color`. */
  color?: boolean;
  /** Whether to show all log components. Maps to `-A, --showall`. */
  showall?: boolean;
  /** Shortcut for verbose logging. Maps to `-v, --verbose`. */
  verbose?: boolean;
  /** Shortcut for debug logging. Maps to `-D, --debug`. */
  debug?: boolean;
  /** Shortcut for trace logging. Maps to `-T, --trace`. */
  trace?: boolean;
  /** Shortcut for spam logging. Maps to `-S, --spam`. */
  spam?: boolean;
  /** Whether to run in dry-run mode. Maps to `-n, --dry-run`. */
  dryRun?: boolean;
}

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
