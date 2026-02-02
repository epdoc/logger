import type { Command as CliffyCommand } from '@cliffy/command';
import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import type { Dict } from '@epdoc/type';

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
  pkg: DenoPkg;
  /** Gracefully shut down the application and its logger. */
  close: () => Promise<void>;
}

export type CmdOptions = Dict;
export type CmdArgs = string[];

/**
 * A mapping of option flags to their descriptions or configurations.
 */
export type OptionsMap = Record<string, string | OptionConfig>;

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
 * Configuration for subcommands.
 * Can be a mapping of names to their nodes/classes, or a function that returns the mapping.
 */
export type SubCommandsConfig<Ctx extends ICtx> =
  | SubCommandsRecord<Ctx>
  | ((ctx: Ctx) => SubCommandsRecord<Ctx> | Promise<SubCommandsRecord<Ctx>>);

/**
 * A record mapping subcommand names to their implementation (declarative node or class).
 */
export type SubCommandsRecord<Ctx extends ICtx> = Record<
  string,
  CommandNode<Ctx> | CommandClass<Ctx>
>;

/**
 * Constructor type for command classes
 */
export type CommandClass<Ctx extends ICtx> = new () => {
  cmd: CliffyCommand; // Cliffy Command
  setContext(ctx: Ctx, opts?: CmdOptions, args?: CmdArgs): Promise<void>;
  init(): Promise<void>;
};

/**
 * Declarative definition of a command node.
 */
export type CommandNode<Ctx extends ICtx> = {
  /** The description of the command shown in the help menu. */
  description: string;
  /** Optional version string for the command. */
  version?: string;
  /** Optional arguments string for the command, e.g., '<input:string>'. */
  arguments?: string;
  /** Options can be a static map or a function that returns the map based on context. */
  options?: OptionsMap | ((ctx: Ctx) => OptionsMap);
  /** Recursive subcommands mapping names to their nodes or AbstractCmd classes. */
  subCommands?: SubCommandsConfig<Ctx>;
  /**
   * Optional hook to refine or transform the context for this node and its children.
   * Note: This is called during the declarative build phase and also during the
   * post-parse refinement pass.
   */
  refineContext?: (parentCtx: Ctx, opts: CmdOptions, args: unknown[]) => Ctx | Promise<Ctx>;
  /** Hook to configure global actions (for context refinement based on opts). */
  setupGlobalAction?: (cmd: CliffyCommand, ctx: Ctx) => void;
  /** The logic to execute when the command is run. */
  action?: (ctx: Ctx, opts: CmdOptions, ...args: unknown[]) => Promise<void> | void;
  /** Optional setup for command specific options */
  setupOptions?: (cmd: CliffyCommand, ctx: Ctx) => void;
};

/**
 * Base class for all commands, providing context management and lifecycle hooks.
 */
// export abstract class AbstractCmd<Ctx extends ICtx = ICtx> {
//   abstract init(): Promise<void>;
//   abstract setContext(ctx: Ctx, opts?: CmdOptions, args?: unknown[]): Promise<void>;
// }

export type ArgOptions = {
  /** Positional arguments passed to the command */
  args: CmdArgs;
};

/**
 * Standard command line options used across most commands.
 */
export type GlobalOptions = CmdOptions & {
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
  /** Do not display color output */
  noColor: boolean;
  /** Dry-run mode - show what would be done without executing */
  dryRun: boolean;
};

/**
 * Interface for silent errors.
 */
export interface ISilentError extends Error {
  silent: boolean;
}
