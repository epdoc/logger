import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import type { DenoPkg } from './pkg-type.ts';

export const MsgBuilder = Console.Builder;
export type MsgBuilder = Console.Builder;
// deno-lint-ignore no-explicit-any
export type Logger = Log.Std.Logger<any>;

/**
 * Extract MsgBuilder type from Logger type using conditional types.
 */
export type ExtractMsgBuilder<L> = L extends Log.Std.Logger<infer M> ? M : MsgBuilder;

/**
 * Clean context interface - much simpler than the old complex system
 */
export interface ICtx<M extends MsgBuilder, L extends Logger = Logger> {
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

const logMgr: Log.Mgr<MsgBuilder> = new Log.Mgr<MsgBuilder>().initLevels();
logMgr.threshold = 'info';

/**
 * Abstract class for the application context.
 *
 * NOTE ON GENERICS AND VARIANCE:
 * TypeScript's Log.Std.Logger is invariant in its message builder type.
 * This means Log.Std.Logger<AppBuilder> is not assignable to Log.Std.Logger<Console.Builder>.
 * To work around this and allow custom builders, we use `any` in the L constraint below.
 * We then use `ExtractMsgBuilder<L>` to recover the actual builder type.
 */
// deno-lint-ignore no-explicit-any
export abstract class Context<M extends MsgBuilder = any, L extends Logger = any> implements ICtx<M, L> {
  log!: L;
  logMgr: Log.Mgr<M>;
  dryRun = false;
  pkg: DenoPkg;

  /**
   * Create a root context using pkg, or a child context using the parent context.
   * For root contexts, you must call setupLogging() after construction.
   * For child contexts, logging is inherited from the parent.
   */
  constructor(pkg: DenoPkg | Context<M, L>, params: Log.IGetChildParams = {}) {
    if (pkg instanceof Context) {
      // Child context - inherit from parent
      this.log = pkg.log.getChild(params) as L;
      this.logMgr = pkg.logMgr;
      this.dryRun = pkg.dryRun;
      this.pkg = pkg.pkg;
    } else {
      // Root context - setupLogging must be called
      this.pkg = pkg;
      this.logMgr = new Log.Mgr<M>();
    }
  }

  /**
   * Setup logging for root context.
   * Call this method after constructing a root context.
   */
  async setupLogging(level: string = 'info'): Promise<void> {
    this.logMgr.initLevels();
    this.logMgr.threshold = level;
    this.log = await this.logMgr.getLogger<L>();
  }

  async close() {
    await this.logMgr?.close();
  }
}
