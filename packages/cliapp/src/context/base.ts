import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import type { DenoPkg } from '../types.ts';
import type * as Ctx from './types.ts';

/**
 * Abstract base context class for CLI applications.
 *
 * Provides a simplified pattern for creating CLI contexts with custom message builders
 * and loggers. Subclasses must implement setupLogging() and call it in their constructor
 * to ensure the context is fully initialized.
 *
 * @example
 * ```typescript
 * class AppContext extends BaseContext<MyMsgBuilder, MyLogger> {
 *   constructor() {
 *     super(pkg);
 *     this.setupLogging(); // Must call in constructor
 *   }
 *
 *   setupLogging() {
 *     this.logMgr = Log.createLogManager(MyBuilder, { threshold: 'info' });
 *     this.log = this.logMgr.getLogger<MyLogger>();
 *   }
 * }
 * ```
 */
export abstract class BaseContext<
  M extends Console.Builder = Console.Builder,
  L extends Log.IEmitter = Log.Std.Logger<M>,
> implements Ctx.IBase<M, L> {
  log!: L; // Will be set in setupLogging
  logMgr!: Log.Mgr<M>;
  dryRun = false;
  pkg: DenoPkg;

  constructor(pkg?: DenoPkg) {
    this.pkg = pkg || { name: 'unknown', version: '0.0.0', description: '' };
    // Don't call setupLogging here - let user control when it happens
  }

  /**
   * Abstract method to initialize logging components.
   *
   * Must be implemented by subclasses and called in their constructor
   * to properly initialize the log and logMgr properties.
   *
   * @example
   * ```typescript
   * setupLogging() {
   *   this.logMgr = Log.createLogManager(MyBuilder, { threshold: 'info' });
   *   this.log = this.logMgr.getLogger<MyLogger>();
   * }
   * ```
   */
  abstract setupLogging(): void;

  async close() {
    await this.logMgr?.close();
  }
}
