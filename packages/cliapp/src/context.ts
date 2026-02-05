import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import type { DenoPkg } from './pkg-type.ts';

export type MsgBuilder = Console.Builder;
export type Logger = Log.Std.Logger<MsgBuilder>;

/**
 * Clean context interface - much simpler than the old complex system
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

/**
 * Clean context implementation - like CliffApp but even simpler
 */
export class Context implements ICtx {
  log!: Logger;
  logMgr!: Log.Mgr<MsgBuilder>;
  dryRun = false;
  pkg: DenoPkg;

  /**
   * Create a root context using pkg. Create a child context using the parent context.
   * @param pkg
   * @param params
   */
  constructor(pkg: DenoPkg | Context, params: Log.IGetChildParams = {}) {
    if (pkg instanceof Context) {
      // Child context - inherit from parent
      this.log = pkg.log.getChild(params);
      this.logMgr = pkg.logMgr;
      this.dryRun = pkg.dryRun;
      this.pkg = pkg.pkg;
    } else {
      // Root context
      this.pkg = pkg;
    }
  }

  /**
   * Setup logging for root context - call once and await
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
