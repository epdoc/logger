/**
 * ProgressMsgBuilder - Extends Console.Builder with progress indicator support.
 *
 * This class provides methods for displaying progress bars, spinners, and other
 * progress indicators in CLI applications. It integrates with @epdoc/progress
 * to show interactive progress in TTY terminals or fall back to regular log
 * messages in non-TTY environments.
 *
 * @example
 * ```typescript
 * class MyContext extends CliApp.Ctx.AbstractBase {
 *   protected override builderClass = CliApp.Progress.ProgressMsgBuilder;
 * }
 *
 * // In your command:
 * async execute(): Promise<void> {
 *   // Start with full builder chain
 *   ctx.log.info.text('Processing').value(fileCount).start({ type: 'spinner', color: 'cyan' });
 *
 *   await processFiles();
 *
 *   // Update with new builder chain - same level required!
 *   ctx.log.info.text('Halfway done').update();
 *
 *   await processMoreFiles();
 *
 *   // Complete with final builder chain
 *   ctx.log.info.icheck().text('All files processed!').complete();
 * }
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
interface ProgressEmitter extends MsgBuilder.IEmitter {
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
 * Architecture:
 * - start() creates and stores ProgressLine on TransportMgr, returns builder
 * - update()/complete()/cancel() retrieve ProgressLine from TransportMgr
 * - All methods use builder's formatted message via this.format()
 * - Auto-stops previous progress on new start()
 * - Asserts validate same level is used for start/update/complete
 */
export class ProgressMsgBuilder extends Console.Builder {
  /**
   * Creates a ProgressMsgBuilder instance.
   *
   * @param emitter - The message emitter from the logger
   */
  constructor(emitter: ConstructorParameters<typeof Console.Builder>[0]) {
    super(emitter);
  }

  /**
   * Start displaying progress.
   *
   * In progress mode (TTY and level matches threshold), shows an interactive
   * progress indicator using @epdoc/progress. In emit mode, emits a regular
   * log message. In suppressed mode, does nothing.
   *
   * Auto-stops any previously active progress (handles developer error).
   *
   * @param options - ProgressLineOptions from @epdoc/progress (type, index, color, etc.)
   * @returns This builder for continued chaining
   *
   * @example
   * ```typescript
   * ctx.log.info.text('Running').value('tasks').start({ type: 'spinner', index: 0, color: 'cyan' });
   * ctx.log.info.start({ type: 'horizontal', total: 100, width: 30, color: 'green' });
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

    // Auto-stop previous progress (handles developer error of forgetting stop/complete)
    if (transportMgr.activeProgress?.isActive) {
      transportMgr.activeProgress.stop();
    }

    if (emitter.progressEnabled) {
      // PROGRESS mode: Show interactive progress
      const progressLine = options ? new Progress.Line(options) : new Progress.Line({ type: 'spinner', index: 0 });

      // Store on TransportMgr for later retrieval by update/complete
      transportMgr.setActiveProgress(progressLine, levelName);

      // Start with formatted message from this builder
      progressLine.start(this.format());
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
   * Asserts that the same log level is used as start() (enforced by design).
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
      const currentLevelName = emitter.level.name;

      // Assert: Must have active progress to update
      assert(
        activeProgress?.isActive,
        `No active progress to update. Call start() first at level ${transportMgr.progressLevelName || 'unknown'}`,
      );

      // Assert: Must use same level as start()
      assert(
        currentLevelName === transportMgr.progressLevelName,
        `Progress update must use same level as start(). Expected ${transportMgr.progressLevelName}, got ${currentLevelName}`,
      );

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
   * In progress mode, clears the progress indicator and shows final text.
   * In emit mode, emits a final log message.
   *
   * Asserts that the same log level is used as start().
   * Automatically clears the active progress from TransportMgr.
   *
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * ctx.log.info.icheck().text('Done!').complete();
   * ctx.log.info.complete(); // Uses current formatted message
   * ```
   */
  complete(): this {
    const emitter = this._emitter as ProgressEmitter;

    // Check SUPPRESSED mode
    if (!emitter.emitEnabled) {
      return this;
    }

    if (emitter.progressEnabled) {
      // PROGRESS mode: Stop progress line
      const transportMgr = emitter.transportMgr;
      const activeProgress = transportMgr.activeProgress;
      const currentLevelName = emitter.level.name;

      // Assert: Must have active progress to complete
      assert(
        activeProgress?.isActive,
        `No active progress to complete. Call start() first at level ${transportMgr.progressLevelName || 'unknown'}`,
      );

      // Assert: Must use same level as start()
      assert(
        currentLevelName === transportMgr.progressLevelName,
        `Progress complete must use same level as start(). Expected ${transportMgr.progressLevelName}, got ${currentLevelName}`,
      );

      const startTime = transportMgr.progressStartTime;
      const elapsed = startTime ? Math.round((performance.now() - startTime) / 10) / 100 : 0;

      let text = this.format();
      if (elapsed > 0) {
        text += ` (${elapsed}s)`;
      }

      activeProgress.stop(text);

      // Clear from TransportMgr
      transportMgr.setActiveProgress(undefined);
    } else {
      // EMIT mode: Emit final message
      this.emit();
    }

    return this;
  }

  /**
   * Cancel progress without showing final message.
   *
   * Clears any active progress indicator without showing final text.
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

      // Clear from TransportMgr
      transportMgr.setActiveProgress(undefined);
    }

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
  emitter: ConstructorParameters<typeof ProgressMsgBuilder>[0],
): ProgressMsgBuilder {
  return new ProgressMsgBuilder(emitter);
}
