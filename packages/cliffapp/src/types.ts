import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';

/**
 * Standard message builder type for Cliffy applications.
 */
export type MsgBuilder = Console.Builder;

/**
 * Standard logger type for Cliffy applications.
 */
export type Logger<M extends MsgBuilder = MsgBuilder> = Log.Std.Logger<M>;

/**
 * Application context for Cliffy applications.
 */
export interface ICtx<M extends MsgBuilder = MsgBuilder, L extends Logger<M> = Logger<M>> {
  /** The logger instance for the application. */
  log: L;
  /** The log manager coordinating loggers and transports. */
  logMgr: Log.Mgr<M>;
  /** Whether the application is running in dry-run mode. */
  dryRun: boolean;
  /** Package information for the application. */
  pkg: {
    /** The name of the package. */
    name: string;
    /** The version of the package. */
    version: string;
    /** An optional description of the package. */
    description?: string;
  };
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
