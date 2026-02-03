import type { Command as CliffyCommand } from '@cliffy/command';
import type { Dict } from '@epdoc/type';
import type { ICtx } from './context.ts';

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
 * Declarative command definition for building command trees without classes.
 *
 * CommandNode allows you to define entire command hierarchies using object literals,
 * providing a functional alternative to class-based command definitions. This is
 * particularly useful for simple commands, configuration-driven CLIs, or rapid prototyping.
 *
 * ## Key Features:
 *
 * **Structure Definition:**
 * - `description`: Command description for help text
 * - `version`: Optional version string
 * - `arguments`: Argument specification (e.g., '<file> [output]')
 *
 * **Options Configuration:**
 * - `options`: Static options map or context-dependent function
 * - `setupOptions`: Advanced option configuration hook
 *
 * **Hierarchy Management:**
 * - `subCommands`: Nested command definitions (recursive)
 * - Supports mixing CommandNode and class-based commands
 *
 * **Context Integration:**
 * - `refineContext`: Transform context based on parsed options
 * - `setupGlobalAction`: Configure global action hooks
 *
 * **Execution:**
 * - `action`: Command implementation function
 *
 * @template Ctx - Application context type
 *
 * @example Simple command:
 * ```typescript
 * const helloCmd: CommandNode<MyContext> = {
 *   description: "Say hello",
 *   options: {
 *     '--name <name>': 'Name to greet'
 *   },
 *   action: (ctx, opts) => {
 *     ctx.log.info.text(`Hello, ${opts.name || 'World'}!`).emit();
 *   }
 * };
 * ```
 *
 * @example Command with context refinement:
 * ```typescript
 * const apiCmd: CommandNode<MyContext> = {
 *   description: "API operations",
 *   options: {
 *     '--api-url <url>': 'API endpoint URL'
 *   },
 *   refineContext: async (ctx, opts) => {
 *     ctx.apiClient = new ApiClient(opts.apiUrl);
 *     return ctx;
 *   },
 *   subCommands: {
 *     users: {
 *       description: "User management",
 *       action: async (ctx) => {
 *         const users = await ctx.apiClient.getUsers();
 *         ctx.log.info.text(`Found ${users.length} users`).emit();
 *       }
 *     }
 *   }
 * };
 * ```
 *
 * @example Mixed with class-based commands:
 * ```typescript
 * const rootCmd: CommandNode<MyContext> = {
 *   description: "My CLI",
 *   subCommands: {
 *     simple: {
 *       description: "Simple declarative command",
 *       action: (ctx) => ctx.log.info.text("Hello!").emit()
 *     },
 *     complex: ComplexClassBasedCommand // Class reference
 *   }
 * };
 * ```
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
