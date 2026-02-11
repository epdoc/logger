import type * as Ctx from './context.ts';

/**
 * Base class providing convenient access to logging methods with proper generic type handling.
 *
 * The primary purpose of this class is to allow applications to define their own concrete
 * base class once with their custom types, then extend that throughout the application
 * without having to deal with generics again. This eliminates repetitive generic declarations
 * across all application classes.
 *
 * @template C - Context type extending ICtx
 * @template M - Message builder type (automatically inferred from context)
 * @template L - Logger type (automatically inferred from context)
 *
 * @example
 * ```typescript
 * // Step 1: Define your custom types once
 * class CustomMsgBuilder extends Console.Builder {
 *   fileOp(path: string) { return this.text(path); }
 * }
 * type CustomLogger = Log.Std.Logger<CustomMsgBuilder>;
 * class RootContext extends AbstractBase<CustomMsgBuilder, CustomLogger> { ... }
 *
 * // Step 2: Create your application's base class once (handles all generics)
 * export abstract class Base extends CliApp.BaseClass<RootContext, CustomMsgBuilder, CustomLogger> {}
 *
 * // Step 3: All application classes extend Base without any generics
 * class MyService extends Base {
 *   doWork() {
 *     this.info.text('Starting work').emit();
 *     this.debug.fileOp('/path/to/file').emit(); // Custom method available
 *   }
 * }
 *
 * class AnotherService extends Base {
 *   process() {
 *     this.warn.text('Processing').emit(); // No generics needed
 *   }
 * }
 * ```
 */
export abstract class BaseClass<
  C extends Ctx.ICtx<M, L>,
  M extends Ctx.MsgBuilder,
  L extends Ctx.Logger,
> {
  /** The application context containing logger and configuration. */
  ctx: C;

  /**
   * Creates a new base class instance with the given context.
   *
   * @param ctx - Application context providing logger and configuration
   */
  constructor(ctx: C) {
    this.ctx = ctx;
  }

  /** Access the full logger instance. */
  get log(): L {
    return this.ctx.log;
  }

  /** Start a spam-level log message. */
  get spam(): M {
    return this.ctx.log.spam;
  }

  /** Start a trace-level log message. */
  get trace(): M {
    return this.ctx.log.trace;
  }

  /** Start a debug-level log message. */
  get debug(): M {
    return this.ctx.log.debug;
  }

  /** Start a verbose-level log message. */
  get verbose(): M {
    return this.ctx.log.verbose;
  }

  /** Start an info-level log message. */
  get info(): M {
    return this.ctx.log.info;
  }

  /** Start a warning-level log message. */
  get warn(): M {
    return this.ctx.log.warn;
  }

  /** Start an error-level log message. */
  get error(): M {
    return this.ctx.log.error;
  }

  /** Start a critical-level log message. */
  get critical(): M {
    return this.ctx.log.critical;
  }

  /** Start a fatal-level log message. */
  get fatal(): M {
    return this.ctx.log.fatal;
  }

  /**
   * Log a section header at info level.
   *
   * @param s - Section title text
   * @returns Message builder for chaining
   */
  section(s: string): M {
    return this.ctx.log.info.section(s);
  }
}
