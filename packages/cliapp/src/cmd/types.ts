/**
 * @file Type definitions for the structured command system
 *
 * This file contains type definitions that enable the bundled context pattern,
 * which simplifies generic type management in CLI applications.
 */

/**
 * A type bundle that groups together the three core types needed for CLI commands:
 * Context, MsgBuilder, and Logger.
 *
 * This pattern reduces the number of generic parameters from 4 to 2 in command classes,
 * making the API much cleaner and easier to use.
 *
 * @template Context - The application context type (extends some base context)
 * @template MsgBuilder - The message builder type (e.g., Console.Builder or extended version)
 * @template Logger - The logger type (typically Log.Std.Logger<MsgBuilder>)
 *
 * @example Basic usage with standard types
 * ```typescript
 * type AppBundle = ContextBundle<
 *   AppContext,
 *   Console.Builder,
 *   Log.Std.Logger<Console.Builder>
 * >;
 *
 * class MyCmd extends CliApp.Cmd.Sub<AppBundle, MyOptions> {
 *   // Command implementation
 * }
 * ```
 *
 * @example Usage with custom message builder
 * ```typescript
 * const CustomBuilder = Console.extender({
 *   fileOp(path: string) { return this.text('📁 ').path(path); }
 * });
 *
 * type CustomBundle = ContextBundle<
 *   AppContext,
 *   InstanceType<typeof CustomBuilder>,
 *   Log.Std.Logger<InstanceType<typeof CustomBuilder>>
 * >;
 *
 * class MyCmd extends CliApp.Cmd.Sub<CustomBundle, MyOptions> {
 *   // Can use this.ctx.log.info.fileOp('/path/to/file').emit()
 * }
 * ```
 *
 * @example Without ContextBundle (verbose)
 * ```typescript
 * // Old way - 4 generic parameters
 * class MyCmd extends CliApp.Cmd.Sub<AppContext, MyOptions, MsgBuilder, Logger> {
 *   // Same functionality but more verbose type signature
 * }
 * ```
 *
 * @example With ContextBundle (clean)
 * ```typescript
 * // New way - 2 generic parameters
 * class MyCmd extends CliApp.Cmd.Sub<AppBundle, MyOptions> {
 *   // Much cleaner and easier to read
 * }
 * ```
 */
export type ContextBundle<
  Context,
  MsgBuilder,
  Logger,
> = {
  /** The application context type */
  Context: Context;
  /** The message builder type used for logging */
  MsgBuilder: MsgBuilder;
  /** The logger type that uses the message builder */
  Logger: Logger;
};
