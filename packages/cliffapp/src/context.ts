import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import type { DenoPkg } from './pkg-type.ts';

export type MsgBuilder = Console.Builder;
export type Logger = Log.Std.Logger<MsgBuilder>;

export class Context implements ICtx<MsgBuilder, Logger> {
  log!: Logger;
  logMgr!: Log.Mgr<MsgBuilder>;
  dryRun = false;
  pkg: DenoPkg;

  constructor(pkg: DenoPkg | Context, params: Log.IGetChildParams = {}) {
    if (pkg instanceof Context) {
      this.log = pkg.log.getChild(params);
      this.logMgr = pkg.logMgr;
      this.dryRun = pkg.dryRun;
      this.pkg = pkg.pkg;
    } else {
      this.pkg = pkg;
    }
    // Setup logging must be called explicitly and awaited
  }

  /**
   * For root contexts, setupLogging must be called explicitly and awaited. Otherwise this method
   * should not be called.
   */
  async setupLogging(level = 'info') {
    this.logMgr = new Log.Mgr<MsgBuilder>();
    this.logMgr.initLevels();
    this.logMgr.threshold = level;
    this.log = await this.logMgr.getLogger<Logger>();
  }

  async close() {
    await this.logMgr.close();
  }
}

/**
 * Core application context interface for Cliffy applications.
 *
 * This interface defines the essential services and state that every command
 * in your CLI application can access. It provides the foundation for logging,
 * configuration management, and application lifecycle.
 *
 * ## Key Properties:
 *
 * **Logging System:**
 * - `log`: Direct access to logger for emitting messages
 * - `logMgr`: Manager for configuring logging behavior
 *
 * **Application State:**
 * - `dryRun`: Flag indicating whether to perform actual operations
 * - `pkg`: Package metadata from deno.json
 *
 * **Lifecycle Management:**
 * - `close()`: Cleanup method called during shutdown
 *
 * @template M - Message builder type for customizing log message formatting
 * @template L - Logger type that works with the message builder
 *
 * @example Basic implementation:
 * ```typescript
 * class MyContext implements ICtx {
 *   log!: Logger;
 *   logMgr!: LogManager;
 *   dryRun = false;
 *   pkg = { name: "my-app", version: "1.0.0", description: "My CLI" };
 *
 *   async close() {
 *     await this.logMgr.close();
 *   }
 * }
 * ```
 *
 * @example Extended context with services:
 * ```typescript
 * interface ApiContext extends ICtx {
 *   apiClient: ApiClient;
 *   database: DatabaseConnection;
 *   config: AppConfig;
 * }
 *
 * class MyApiContext implements ApiContext {
 *   // ... ICtx properties
 *   apiClient!: ApiClient;
 *   database!: DatabaseConnection;
 *   config!: AppConfig;
 * }
 * ```
 */
export interface ICtx<M extends MsgBuilder = MsgBuilder, L extends Logger = Logger> {
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
