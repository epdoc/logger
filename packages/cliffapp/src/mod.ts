/**
 * @epdoc/cliffapp - Unified CLI Command Framework
 *
 * A comprehensive framework bridging @epdoc/logger and deno-cliffy, providing
 * both declarative and class-based patterns for building command-line applications
 * with progressive context refinement and standardized logging integration.
 *
 * ## Key Features:
 *
 * **Unified Architecture:**
 * - Single `Command` class supports both declarative and class-based patterns
 * - Seamless mixing of approaches within the same application
 * - Progressive context refinement down the command tree
 *
 * **Standardized Logging:**
 * - Built-in integration with @epdoc/logger
 * - Standard CLI options: --verbose, --debug, --log-level, --dry-run
 * - Automatic logging configuration from parsed options
 *
 * **Production Ready:**
 * - Complete application lifecycle management
 * - Signal handling and graceful shutdown
 * - Error handling with SilentError support
 * - Performance monitoring and reporting
 *
 * ## Quick Start:
 *
 * ```typescript
 * import { Command, addLoggingOptions, run } from "@epdoc/cliffapp";
 *
 * // Declarative approach
 * const cmd = new Command({
 *   description: "My CLI",
 *   setupGlobalAction: (cmd, ctx) => addLoggingOptions(cmd, ctx),
 *   action: (ctx) => ctx.log.info.text("Hello World!").emit()
 * });
 *
 * // Class-based approach
 * class MyCommand extends Command<MyContext> {
 *   protected override setupOptions(): void {
 *     this.cmd.description("My CLI");
 *     addLoggingOptions(this.cmd, this.ctx);
 *   }
 * }
 *
 * // Run it
 * const ctx = new MyContext();
 * await cmd.setContext(ctx);
 * await cmd.init();
 * await run(ctx, cmd.cmd);
 * ```
 *
 * ## Architecture:
 *
 * The framework uses staged initialization to handle the flow of options down
 * the command tree. Root options (like --api-url) are parsed first, then used
 * to create specialized contexts (like ApiClient) that flow down to child commands.
 *
 * This enables powerful patterns like:
 * - API clients created from global options
 * - Database connections established at the appropriate level
 * - Progressive context specialization as you go deeper in the tree
 *
 * @module
 */

export * from './command.ts';
export * from './logging.ts';
export * from './run.ts';
export * from './silent-error.ts';
export * from './types.ts';
