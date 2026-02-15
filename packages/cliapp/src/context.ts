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
 * Abstract base class for all application contexts.
 *
 * The context is the central state object passed through the entire command tree. It holds the
 * logger, log manager, dry-run flag, and any application-specific state.
 *
 * There are two construction modes:
 * - **Root context**: Pass a `DenoPkg` object. You must call {@link setupLogging} before using the
 *   logger or calling {@link run}.
 * - **Child context**: Pass a parent `AbstractBase` instance. Logging is inherited from the parent
 *   automatically. Call {@link copyProperties} in the subclass constructor to copy custom fields.
 *
 * @template M - Message builder type (defaults to `Console.Builder`)
 * @template L - Logger type (defaults to `Std.Logger<Console.Builder>`)
 *
 * @example Root context with default MsgBuilder
 * ```typescript
 * class AppContext extends CliApp.Ctx.AbstractBase {
 *   configFile?: string;
 * }
 * const ctx = new AppContext(pkg);
 * await ctx.setupLogging({ pkg: 'app' });
 * ```
 *
 * @example Root context with custom MsgBuilder
 * ```typescript
 * class AppBuilder extends Console.Builder {
 *   fileOp(op: string, path: string) { return this.label(op).value(path); }
 * }
 * type AppLogger = Log.Std.Logger<AppBuilder>;
 *
 * class AppContext extends CliApp.Ctx.AbstractBase<AppBuilder, AppLogger> {
 *   protected override builderClass = AppBuilder;
 * }
 * const ctx = new AppContext(pkg);
 * await ctx.setupLogging({ pkg: 'app' });
 * ```
 *
 * @example Child context (per-subcommand isolation)
 * ```typescript
 * class ChildContext extends AppContext {
 *   processedFiles = 0;
 *
 *   constructor(parent: AppContext, params?: Log.IGetChildParams) {
 *     super(parent, params);
 *     this.copyProperties(parent); // copy custom fields after super()
 *   }
 * }
 * // In a subcommand's createContext():
 * override createContext(parent?: AppContext): ChildContext {
 *   return new ChildContext(parent!, { pkg: 'process' });
 * }
 * ```
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
   * Initializes logging for the root context.
   *
   * Must be called after constructing a root context and before calling {@link run} or accessing
   * `this.log`. This step is separate from the constructor because `getLogger()` is async (some
   * transports require async initialization).
   *
   * Has no effect when called on a child context — logging is inherited from the parent.
   *
   * @param [levelOrParams='info'] - Initial log level threshold (e.g. `'info'`, `'debug'`), or a
   *   params object if you want to set `pkg`, `reqId`, or `sid` without changing the default level.
   * @param [params] - Context params (`pkg`, `reqId`, `sid`) when `levelOrParams` is a string.
   *
   * @example
   * ```typescript
   * const ctx = new AppContext(pkg);
   * await ctx.setupLogging({ pkg: 'app' });          // default 'info' level
   * await ctx.setupLogging('debug', { pkg: 'app' }); // explicit level + pkg
   * ```
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
