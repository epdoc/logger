import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import type { DenoPkg } from './pkg-type.ts';

export type MsgBuilder = Console.Builder;
export type Logger = Log.Std.Logger<MsgBuilder>;

/**
 * Extract MsgBuilder type from Logger type
 */
export type ExtractMsgBuilder<L> = L extends Log.Std.Logger<infer M> ? M : MsgBuilder;

/**
 * Clean context interface - much simpler than the old complex system
 */
export interface ICtx<M extends Console.Builder = MsgBuilder, L = Log.Std.Logger<M>> {
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

/**
 * Abstract base context class for CLI applications.
 *
 * Extend this class and implement setupLogging() to create contexts with custom message builders.
 * The MsgBuilder type is automatically inferred from the Logger type.
 *
 * @template L - Logger type (MsgBuilder is automatically extracted)
 *
 * @example
 * ```typescript
 * class AppBuilder extends Console.Builder {
 *   fileOp(op: string, path: string) { return this.text(op).text(' ').text(path); }
 * }
 * type Logger = Log.Std.Logger<AppBuilder>;
 *
 * class AppContext extends Context<Logger> {
 *   async setupLogging() {
 *     this.logMgr = new Log.Mgr<AppBuilder>();
 *     this.logMgr.msgBuilderFactory = (emitter) => new AppBuilder(emitter);
 *     this.log = await this.logMgr.getLogger<Logger>();
 *   }
 * }
 * ```
 */
export abstract class Context<L extends Log.Std.Logger<any> = Logger> implements ICtx<ExtractMsgBuilder<L>, L> {
  log!: L;
  logMgr!: Log.Mgr<ExtractMsgBuilder<L>>;
  dryRun = false;
  pkg: DenoPkg;

  /**
   * Create a root context using pkg, or a child context using the parent context.
   * For root contexts, you must call setupLogging() after construction.
   * For child contexts, logging is inherited from the parent.
   */
  constructor(pkg: DenoPkg | Context<L>, params: Log.IGetChildParams = {}) {
    if (pkg instanceof Context) {
      // Child context - inherit from parent
      this.log = pkg.log.getChild(params) as L;
      this.logMgr = pkg.logMgr;
      this.dryRun = pkg.dryRun;
      this.pkg = pkg.pkg;
    } else {
      // Root context - setupLogging must be called
      this.pkg = pkg;
    }
  }

  /**
   * Setup logging for root context - must be implemented by subclasses.
   * Call this method after constructing a root context.
   */
  abstract setupLogging(): void | Promise<void>;

  async close() {
    await this.logMgr?.close();
  }
}
