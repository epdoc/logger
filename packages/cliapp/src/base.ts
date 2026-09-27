import type * as Log from '@epdoc/logger';
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

  /**
   * Run `fn` inside an indented logging scope. The matching outdent is
   * guaranteed on return, early return, throw, or promise rejection.
   *
   * Works for both sync and async callbacks with a single signature. `T` is
   * the callback's return type and is passed through unchanged: a sync
   * callback returns `T` directly, an async callback returns a `Promise<T>`
   * that resolves to `T`.
   *
   * `n` is forwarded to {@link @epdoc/logger.Indent.IndentLogger.indent} and
   * accepts the same values: a `number` of space levels (negative to remove),
   * a literal `string`, a `string[]` of levels, `false` to reset (nodent), or
   * `undefined` for a single default level.
   *
   * @template T - The callback's return type, preserved through the scope.
   * @param fn - Callback executed within the indented scope.
   * @param n - Indentation value(s), forwarded to the underlying logger.
   * @returns Whatever `fn` returns (or resolves to).
   *
   * @example
   * ```ts
   * // T is inferred from the callback's return type — here `string`
   * const status = this.indent(() => {
   *   this.info.text('Checking auth').emit();
   *   return 'authenticated'; // T = string
   * });
   * // status: string
   *
   * // T can be any type — here an object, or set explicitly
   * interface User { id: number; name: string }
   * const user = this.indent<User>(() => {
   *   this.debug.text('Loading user').emit();
   *   return { id: 1, name: 'Ada' };
   * });
   * // user: User
   *
   * // T is preserved through async — here T = Promise<number>
   * const count = await this.indent(async () => {
   *   this.info.text('Counting rows').emit();
   *   return await db.count('users');
   * });
   * // count: number
   *
   * // Indentation arguments are forwarded to the logger
   * this.indent(3, () => { this.info.text('Indented 3').emit(); });
   * this.indent('>>', () => { this.info.text('Indented with ">>"').emit(); });
   * ```
   * @experimental
   */
  indent<T>(fn: () => T): T;
  indent<T>(n: number | string | string[] | false, fn: () => T): T;
  indent<T>(nOrFn: number | string | string[] | false | (() => T), maybeFn?: () => T): T {
    const n = typeof nOrFn === 'function' ? undefined : nOrFn;
    const fn = (typeof nOrFn === 'function' ? nOrFn : maybeFn)!;
    return this.#scope(() => this.ctx.log.indent(n), fn);
  }

  /**
   * Run `fn` inside a quote logging scope. The matching outdent is
   * guaranteed on return, early return, throw, or promise rejection.
   *
   * Works for both sync and async callbacks with a single signature. `T` is
   * the callback's return type and is passed through unchanged: a sync
   * callback returns `T` directly, an async callback returns a `Promise<T>`
   * that resolves to `T`.
   *
   * `countOrMod` and any trailing `mods` are forwarded to
   * {@link @epdoc/logger.Indent.IndentLogger.quote} and accept the same values:
   * a `number` of levels, a named {@link @epdoc/msgbuilder.LineType}, a literal
   * bar glyph `string`, a `StyleFormatterFn` override, or a
   * {@link @epdoc/msgbuilder.QuoteOpts} object.
   *
   * @template T - The callback's return type, preserved through the scope.
   * @param fn - Callback executed within the quote scope.
   * @param countOrMod - Number of levels, or a modifier.
   * @param mods - Additional modifiers.
   * @returns Whatever `fn` returns (or resolves to).
   *
   * @example
   * ```ts
   * // Sync — result is the callback's return value
   * const name = this.quote(() => {
   *   this.info.text('Quoting a value').emit();
   *   return 'hello';
   * });
   *
   * // Async — result is a Promise that resolves to the callback's return value
   * const reply = await this.quote(async () => {
   *   this.info.text('Awaiting').emit();
   *   return await ask();
   * });
   *
   * // Quote arguments are forwarded to the logger
   * this.quote(2, () => { this.info.text('Two bars').emit(); });
   * this.quote('thick', () => { this.info.text('Thick bar').emit(); });
   * ```
   * @experimental
   */
  quote<T>(fn: () => T): T;
  quote<T>(countOrMod: number | Log.Indent.QuoteMod, ...args: [...Log.Indent.QuoteMod[], fn: () => T]): T;
  quote<T>(...args: (number | Log.Indent.QuoteMod | (() => T))[]): T {
    const fn = args.pop() as () => T;
    const mods = args as [number | Log.Indent.QuoteMod, ...Log.Indent.QuoteMod[]];
    return this.#scope(() => this.ctx.log.quote(...mods), fn);
  }

  /**
   * Run `fn` inside a logging scope opened by `open`. The matching outdent is
   * guaranteed on return, early return, throw, or promise rejection.
   *
   * Shared implementation for {@link indent} and {@link quote}. `T` is the
   * callback's return type and is passed through unchanged: a sync callback
   * returns `T` directly, an async callback returns a `Promise<T>` that
   * resolves to `T`.
   *
   * @template T - The callback's return type, preserved through the scope.
   * @param open - Opens the scope (e.g. `indent()` or `quote()`), returning a
   *   disposable that reverses the exact levels it added.
   * @param fn - Callback executed within the scope.
   * @returns Whatever `fn` returns (or resolves to).
   * @experimental
   */
  #scope<T>(open: () => Disposable, fn: () => T): T {
    const scope = open();

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      scope[Symbol.dispose]();
    };

    let result: T;
    try {
      result = fn();
    } catch (err) {
      close();
      throw err;
    }

    if (result instanceof Promise) {
      // `result` narrows to `Promise<any>` here; we know it's `T` because
      // `T` is the callback's return type and the callback returned a Promise.
      return result.finally(close) as T;
    }

    close();
    return result;
  }
}
