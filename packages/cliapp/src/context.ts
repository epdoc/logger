import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import { _ } from '@epdoc/type';
import type { DenoPkg } from './pkg-type.ts';

export const MsgBuilder = Console.Builder;
export type MsgBuilder = Console.Builder;
// deno-lint-ignore no-explicit-any
export type Logger = Log.Std.Logger<any>;

/**
 * Interface for the MCP result collector. Commands use this to emit structured
 * output intended for the MCP tool response, separate from diagnostic logging.
 *
 * In CLI mode this property is typically undefined. In MCP mode it is set by
 * the MCP server before command execution.
 */
export interface IMcpResult {
  /** Emit a text result. */
  text(value: string): this;
  /** Emit structured data as JSON. */
  data(value: unknown, indent?: number): this;
}

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
  /**
   * Optional MCP result collector. When present (MCP mode), commands should use
   * this to emit output intended as the tool response. When absent (CLI mode),
   * commands output normally via logging or console.
   */
  mcpResult?: IMcpResult;
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
export abstract class AbstractBase<
  // deno-lint-ignore no-explicit-any
  M extends MsgBuilder = any,
  // deno-lint-ignore no-explicit-any
  L extends Logger = any,
> implements ICtx<M, L> {
  log!: L;
  logMgr: Log.Mgr<M>;
  dryRun = false;
  pkg: DenoPkg;
  mcpResult?: IMcpResult;

  /**
   * Optional builder class that can be specified by subclasses to automatically
   * configure the msgBuilderFactory.
   */
  // deno-lint-ignore no-explicit-any
  protected builderClass?: new (emitter: any) => M;

  /**
   * Create a root context using pkg, or a child context using the parent context.
   * For root contexts, you must call setupLogging() after construction, and set IGetChildParams there.
   * For child contexts, logging is inherited from the parent, and params are applied here in the constructor.
   */
  constructor(
    arg: DenoPkg | AbstractBase<M, L>,
    params: Log.IGetChildParams = {},
  ) {
    if (arg instanceof AbstractBase) {
      // Child context - inherit from parent
      // Note: We cannot use Object.assign(this, pkg) here because field initializers
      // in the subclass run AFTER this constructor returns, forcing default values
      // to overwrite inherited values. Use copyProperties(pkg) in the subclass instead.
      this.log = arg.log.getChild(params) as L;
      this.logMgr = arg.logMgr;
      this.dryRun = arg.dryRun;
      this.pkg = arg.pkg;
    } else {
      // Root context - setupLogging must be called
      this.pkg = arg;
      this.logMgr = new Log.Mgr<M>();
    }
  }

  /**
   * Helper to copy properties from a parent context.
   * Call this in your subclass constructor *after* super() to ensure inherited values
   * overwrite default field initializers.
   *
   * @example
   * ```typescript
   * constructor(parent: AppContext) {
   *   super(parent);
   *   this.copyProperties(parent);
   * }
   * ```
   */
  // deno-lint-ignore no-explicit-any
  protected copyProperties(parent: AbstractBase<any, any>): void {
    const { log: _log, logMgr: _logMgr, dryRun: _dryRun, pkg: _pkg, ...rest } = parent as unknown as AbstractBase;
    Object.assign(this, rest);
  }

  /**
   * Setup logging for root context. This separate step is necessary because getLogger() may block
   * with some transports. Call this method after constructing a root context.
   * @param [levelOrParams='info'] - Log level string or params object
   * @param [params] - [Root contexts only] This is where you set pkg, reqId or sid for a root context
   */
  async setupLogging(
    levelOrParams: string | Log.IGetChildParams = 'info',
    params?: Log.IGetChildParams,
  ): Promise<void> {
    const level = _.isString(levelOrParams) ? levelOrParams : 'info';
    const actualParams = _.isString(levelOrParams) ? (params ?? {}) : levelOrParams;

    if (this.builderClass) {
      this.logMgr.msgBuilderFactory = (emitter) => new this.builderClass!(emitter);
    }
    this.logMgr.initLevels();
    this.logMgr.threshold = level;
    this.log = await this.logMgr.getLogger<L>(actualParams);
  }

  async close() {
    await this.logMgr?.close();
  }
}
