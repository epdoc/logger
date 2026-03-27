/**
 * ProgressMsgBuilder - Extends Console.Builder with progress indicator support.
 *
 * This class provides methods for displaying progress bars, spinners, and other
 * progress indicators in CLI applications. It integrates with @epdoc/progress
 * to show interactive progress in TTY terminals or fall back to regular log
 * messages in non-TTY environments.
 *
 * Supports **nested progress** - you can start a new progress while another is
 * running. The progress line will show the nested message, and completing it
 * restores the parent progress message.
 *
 * Supports the **"using" pattern** (TypeScript Disposable) for automatic cleanup.
 *
 * @example
 * ```typescript
 * class MyContext extends CliApp.Ctx.AbstractBase {
 *   protected override builderClass = CliApp.Progress.ProgressMsgBuilder;
 * }
 *
 * // Basic usage
 * async execute(): Promise<void> {
 *   ctx.log.info.text('Processing').start({ type: 'spinner', color: 'cyan' });
 *   await processFiles();
 *   ctx.log.info.text('Done!').complete();
 * }
 *
 * // Nested progress - parent restored when child completes
 * async nestedExample(): Promise<void> {
 *   ctx.log.info.text('Building project').start();
 *
 *   ctx.log.info.text('  Compiling TypeScript').start();
 *   await compileTypeScript();
 *   ctx.log.info.text('  Compiled').complete(); // Shows "Building project" again
 *
 *   ctx.log.info.text('  Bundling assets').start();
 *   await bundleAssets();
 *   ctx.log.info.text('  Bundled').complete(); // Shows "Building project" again
 *
 *   ctx.log.info.icheck().text('Build complete!').complete();
 * }
 *
 * // Using pattern - automatic cleanup
 * using _progress = ctx.log.info.text('Processing').start();
 * await doWork(); // Automatically completes on block exit
 * ```
 */
import { assert } from '@std/assert';
import type * as Level from '@epdoc/loglevels';
import type * as Log from '@epdoc/logger';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { Console } from '@epdoc/msgbuilder';
import * as Progress from '@epdoc/progress';

/**
 * Extended emitter interface that includes progress support and transportMgr access.
 * This matches the MsgEmitter interface from @epdoc/logger.
 */
export interface ProgressEmitter extends MsgBuilder.IEmitter {
  /** True when progress mode is enabled (level matches threshold and TTY available) */
  progressEnabled: boolean;
  /** Access to transport manager for active progress storage */
  transportMgr: Log.Transport.Mgr;
  /** The current log level spec */
  readonly level: Level.Spec;
}

/**
 * Message builder with progress indicator support.
 *
 * Extends Console.Builder with methods for displaying progress bars, spinners,
 * and updating progress in-place using @epdoc/progress.
 *
 * Supports **nested progress** - multiple progress levels can be active simultaneously.
 * When you call `start()` during an active progress, it pushes the current context
 * to a stack and shows the new message. When you call `complete()`, it pops the
 * stack and restores the parent progress message.
 *
 * Implements **Disposable** for the "using" pattern - progress automatically
 * completes when the builder goes out of scope.
 *
 * Architecture:
 * - start() creates progress, supports nesting via stack on TransportMgr
 * - update() updates the current progress line
 * - complete()/stop() finish current level, restore parent if nested
 * - cancel() clears entire stack (emergency cleanup)
 * - All methods use builder's formatted message via this.format()
 */
export class ProgressMsgBuilder extends Console.Builder implements Disposable {
  #startLevelName?: string;
  #startMessage?: string;
  #isActive = false;

  /**
   * Creates a ProgressMsgBuilder instance.
   *
   * @param emitter - The message emitter from the logger
   */
  constructor(emitter: ProgressEmitter) {
    super(emitter);
  }

  /**
   * Start displaying progress.
   *
   * In progress mode (TTY and level matches threshold), shows an interactive
   * progress indicator using @epdoc/progress. In emit mode, emits a regular
   * log message. In suppressed mode, does nothing.
   *
   * Supports **nested progress** - if a progress is already active, this call
   * pushes the current context to a stack and shows the new message. When
   * complete() is called, the parent progress message is restored.
   *
   * @param options - ProgressLineOptions from @epdoc/progress (type, index, color, etc.)
   * @returns This builder for continued chaining. Can be used with "using" pattern.
   *
   * @example
   * ```typescript
   * // Basic usage
   * ctx.log.info.text('Running').value('tasks').start({ type: 'spinner', index: 0, color: 'cyan' });
   *
   * // Nested progress - parent restored when child completes
   * ctx.log.info.text('Building').start();
   * ctx.log.info.text('  Compiling').start(); // Shows "  Compiling"
   * ctx.log.info.text('  Done').complete();    // Shows "Building" again
   * ctx.log.info.text('Build complete').complete();
   *
   * // Using pattern - automatic cleanup
   * using _progress = ctx.log.info.text('Processing').start();
   * await doWork(); // Automatically completes on block exit
   * ```
   */
  start(options?: Progress.LineOptions): this {
    const emitter = this._emitter as ProgressEmitter;

    // Check SUPPRESSED mode
    if (!emitter.emitEnabled) {
      return this;
    }

    const transportMgr = emitter.transportMgr;
    const levelName = emitter.level.name;
    const message = this.format();

    if (emitter.progressEnabled) {
      if (transportMgr.hasActiveProgress) {
        // NESTED: Push new context to stack, update progress line with new message
        transportMgr.pushNestedProgress(message, levelName);
        // Update the existing progress line to show nested message
        transportMgr.activeProgress?.update(message);
      } else {
        // NEW: Create new progress line
        const progressLine = options ? new Progress.Line(options) : new Progress.Line({ type: 'spinner', index: 0 });

        // Store on TransportMgr for later retrieval by update/complete
        transportMgr.setActiveProgress(progressLine, levelName, message, options as Record<string, unknown>);

        // Start with formatted message from this builder
        progressLine.start(message);
      }

      // Track this builder's state for "using" pattern
      this.#isActive = true;
      this.#startLevelName = levelName;
      this.#startMessage = message;
    } else {
      // EMIT mode: Emit as regular log message
      this.emit();
    }

    return this;
  }

  /**
   * Update the progress display.
   *
   * In progress mode, updates the in-place progress indicator.
   * In emit mode, emits a new log message.
   *
   * Works with nested progress - updates the current (most recent) progress level.
   *
   * @param progressValue - Optional progress value (for horizontal/vertical modes)
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * ctx.log.info.text('Loading config').update();
   * ctx.log.info.update(50); // Update progress bar to 50%
   * ```
   */
  update(progressValue?: number): this {
    const emitter = this._emitter as ProgressEmitter;

    // Check SUPPRESSED mode
    if (!emitter.emitEnabled) {
      return this;
    }

    if (emitter.progressEnabled) {
      // PROGRESS mode: Update in-place
      const transportMgr = emitter.transportMgr;
      const activeProgress = transportMgr.activeProgress;

      // Assert: Must have active progress to update
      assert(
        activeProgress?.isActive,
        `No active progress to update. Call start() first`,
      );

      // Update the current progress line (works with nested progress)
      activeProgress.update(this.format(), progressValue);
    } else {
      // EMIT mode: Emit as new log message
      this.emit();
    }

    return this;
  }

  /**
   * Complete the progress with final message.
   *
   * In progress mode, handles nested progress:
   * - If nested (depth > 1), pops the stack and restores the parent progress message
   * - If top-level (depth = 1), stops the progress indicator and shows final text
   *
   * In emit mode, emits a final log message.
   *
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * // Top-level completion
   * ctx.log.info.icheck().text('Done!').complete();
   *
   * // Nested completion - parent restored
   * ctx.log.info.text('Building').start();
   * ctx.log.info.text('  Compiling').start();
   * ctx.log.info.text('  Done').complete(); // Shows "Building" again
   * ctx.log.info.text('Build complete').complete();
   * ```
   */
  complete(): this {
    const emitter = this._emitter as ProgressEmitter;

    // Check SUPPRESSED mode
    if (!emitter.emitEnabled) {
      return this;
    }

    if (emitter.progressEnabled) {
      // PROGRESS mode: Handle nested progress
      const transportMgr = emitter.transportMgr;
      const activeProgress = transportMgr.activeProgress;

      // Assert: Must have active progress to complete
      assert(
        activeProgress?.isActive,
        `No active progress to complete. Call start() first`,
      );

      const nestingDepth = transportMgr.progressNestingDepth;

      if (nestingDepth > 1) {
        // NESTED: Pop context and restore parent
        const parentContext = transportMgr.popProgressContext();
        if (parentContext) {
          // Update the progress line to show the parent's message again
          activeProgress.update(parentContext.message);
        }
      } else {
        // TOP-LEVEL: Stop the progress line
        const startTime = transportMgr.progressStartTime;
        const elapsed = startTime ? Math.round((performance.now() - startTime) / 10) / 100 : 0;

        let text = this.format();
        if (elapsed > 0) {
          text += ` (${elapsed}s)`;
        }

        activeProgress.stop(text);
        transportMgr.clearActiveProgress();
      }

      // Clear this builder's tracking state
      this.#isActive = false;
    } else {
      // EMIT mode: Emit final message
      this.emit();
    }

    return this;
  }

  /**
   * Alias for complete(). Stops the progress with final message.
   *
   * @returns This builder for chaining
   * @see complete
   */
  stop(): this {
    return this.complete();
  }

  /**
   * Cancel progress without showing final message.
   *
   * Clears any active progress indicator without showing final text.
   * Clears the entire progress stack (all nested levels).
   * Can be called from any level (e.g., error handling at error level).
   *
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * try {
   *   // ... progress operations ...
   * } catch (error) {
   *   ctx.log.error.cancel(); // Cancel from error level
   *   ctx.log.error.text('Operation failed').emit();
   * }
   * ```
   */
  cancel(): this {
    const emitter = this._emitter as ProgressEmitter;
    const transportMgr = emitter.transportMgr;
    const activeProgress = transportMgr.activeProgress;

    if (activeProgress?.isActive) {
      activeProgress.stop();

      // Clear entire stack from TransportMgr
      transportMgr.clearActiveProgress();
    }

    // Clear this builder's tracking state
    this.#isActive = false;

    return this;
  }

  /**
   * Check if progress is currently active at this level.
   *
   * @returns True if there's an active progress started at this level
   */
  get isProgressActive(): boolean {
    const emitter = this._emitter as ProgressEmitter;
    const transportMgr = emitter.transportMgr;

    return transportMgr.activeProgress?.isActive === true &&
      transportMgr.progressLevelName === emitter.level.name;
  }

  /**
   * Get the current nesting depth of progress operations.
   * 0 = no active progress, 1 = single progress, 2+ = nested
   */
  get nestingDepth(): number {
    const emitter = this._emitter as ProgressEmitter;
    return emitter.transportMgr.progressNestingDepth;
  }

  /**
   * Dispose handler for the "using" pattern.
   * Automatically completes progress when the builder goes out of scope.
   *
   * @example
   * ```typescript
   * using _progress = ctx.log.info.text('Processing').start();
   * await doWork(); // Automatically completes here
   * ```
   */
  [Symbol.dispose](): void {
    if (this.#isActive) {
      this.complete();
    }
  }
}

/**
 * Factory function to create ProgressMsgBuilder.
 *
 * Use this factory when configuring your LogMgr to use ProgressMsgBuilder:
 *
 * @example
 * ```typescript
 * const logMgr = new Log.Mgr<CliApp.Progress.MsgBuilder>();
 * logMgr.msgBuilderFactory = (emitter) => new CliApp.Progress.MsgBuilder(emitter);
 * ```
 */
export function createProgressBuilder(
  emitter: ProgressEmitter,
): ProgressMsgBuilder {
  return new ProgressMsgBuilder(emitter);
}

/**
 * Creates a standalone ProgressEmitter for use without a logger.
 *
 * @remarks
 * This is useful when you need to use ProgressMsgBuilder for formatting only
 * (e.g., building help text) without a full logging setup. The returned emitter
 * disables progress indicator features but allows all formatting methods from
 * Console.Builder to work normally.
 *
 * When using ProgressMsgBuilder with a logger, the library provides a proper
 * ProgressEmitter automatically.
 *
 * @example
 * ```typescript
 * // Standalone usage for help text formatting
 * const emitter = createStandaloneProgressEmitter();
 * const builder = new ProgressMsgBuilder(emitter);
 * const helpText = builder.h1('Help').text('Description').format();
 * ```
 */
export function createStandaloneProgressEmitter(): ProgressEmitter {
  return {
    dataEnabled: false,
    emitEnabled: false,
    stackEnabled: false,
    progressEnabled: false,
    level: { name: 'INFO' as Level.Name, value: 9, severity: 9 } as Level.Spec,
    transportMgr: {
      activeProgress: undefined,
      progressLevelName: undefined,
      progressStartTime: undefined,
      setActiveProgress: () => {},
    } as unknown as Log.Transport.Mgr,
    emit: () => ({
      timestamp: new Date(),
      formatter: { format: () => '' } as MsgBuilder.IFormatter,
      data: undefined,
      elapsed: 0,
    }),
  };
}
