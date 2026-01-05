import type * as Log from '@epdoc/logger';
import type * as Console from '@epdoc/msgbuilder';
import type { DenoPkg } from '../types.ts';
import type * as Ctx from './types.ts';

/**
 * Abstract base context class for CLI applications.
 *
 * Provides a simplified pattern for creating CLI contexts with custom message builders
 * and loggers. Subclasses must implement setupLogging() and call it in their constructor
 * to ensure the context is fully initialized.
 *
 * @template L - Logger type (MsgBuilder is automatically extracted)
 *
 * @example
 * ```typescript
 * class AppBuilder extends Console.Builder {
 *   fileOp(path: string) { return this.text(path); }
 * }
 * type Logger = Log.Std.Logger<AppBuilder>;
 *
 * class AppContext extends BaseContext<Logger> {
 *   constructor() {
 *     super(pkg);
 *     this.setupLogging(); // Must call in constructor
 *   }
 *
 *   setupLogging() {
 *     this.logMgr = new Log.Mgr<AppBuilder>();
 *     this.logMgr.msgBuilderFactory = AppBuilder.createMsgBuilder;
 *     this.logMgr.init(Log.Std.factoryMethods);
 *     this.logMgr.threshold = 'info';
 *     this.log = this.logMgr.getLogger<Logger>();
 *   }
 * }
 * ```
 */
export abstract class BaseContext<L extends Log.IEmitter = Log.Std.Logger<Console.Console.Builder>>
  implements Ctx.IBase<L> {
  log!: L; // Will be set in setupLogging
  logMgr!: Log.Mgr<Ctx.ExtractMsgBuilder<L>>;
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
