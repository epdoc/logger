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
 *   const progress = this.log.info.start({ type: 'spinner', index: 0 });
 *
 *   await processFiles();
 *   progress.update('Halfway done...');
 *   await processMoreFiles();
 *
 *   this.log.info.complete('All files processed!');
 * }
 * ```
 */
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { Console } from '@epdoc/msgbuilder';
import * as Progress from '@epdoc/progress';
import type { ProgressState } from './types.ts';

/**
 * Extended emitter interface that includes progress support.
 * This matches the MsgEmitter interface from @epdoc/logger.
 */
interface ProgressEmitter extends MsgBuilder.IEmitter {
  /** True when progress mode is enabled (level matches threshold and TTY available) */
  progressEnabled: boolean;
}

/**
 * Shared state for progress tracking.
 * This is stored on LogMgr/Transport and shared across all ProgressMsgBuilder instances.
 */
const globalProgressState: ProgressState = {
  isActive: false,
};

/**
 * Message builder with progress indicator support.
 *
 * Extends Console.Builder with methods for displaying progress bars, spinners,
 * and updating progress in-place using @epdoc/progress.
 */
export class ProgressMsgBuilder extends Console.Builder {
  #state: ProgressState;

  /**
   * Creates a ProgressMsgBuilder instance.
   *
   * @param emitter - The message emitter from the logger
   * @param state - Optional shared progress state (uses global state if not provided)
   */
  constructor(emitter: ConstructorParameters<typeof Console.Builder>[0], state?: ProgressState) {
    super(emitter);
    this.#state = state ?? globalProgressState;
  }

  /**
   * Start displaying progress.
   *
   * In progress mode (TTY and level matches threshold), shows an interactive
   * progress indicator using @epdoc/progress. In emit mode, emits a regular
   * log message. In suppressed mode, does nothing.
   *
   * @param options - ProgressLineOptions from @epdoc/progress (type, index, color, etc.)
   * @returns The ProgressLine instance for direct control, or null
   *
   * @example
   * ```typescript
   * const progress = this.log.info.start({ type: 'spinner', index: 0, color: 'cyan' });
   * // or
   * const progress = this.log.info.start({ type: 'horizontal', total: 100, width: 30, color: 'green' });
   * ```
   */
  start(options?: Progress.LineOptions): Progress.Line | null {
    // Check if we should emit at all (SUPPRESSED mode)
    if (!this._emitter.emitEnabled) {
      return null;
    }

    // If there's already an active progress line, stop it first
    if (this.#state.line?.isActive) {
      this.#state.line.stop();
    }

    if ((this._emitter as ProgressEmitter).progressEnabled) {
      // PROGRESS mode: Show interactive progress
      const progressLine = options ? new Progress.Line(options) : new Progress.Line({ type: 'spinner', index: 0 });
      this.#state.line = progressLine;
      this.#state.startTime = performance.now();
      this.#state.isActive = true;

      // Use the formatted message from this builder as the start text
      progressLine.start(this.format());

      return progressLine;
    } else {
      // EMIT mode: Normal log emission
      this.emit();
      return null;
    }
  }

  /**
   * Update the progress display.
   *
   * In progress mode, updates the in-place progress indicator.
   * In emit mode, emits a new log message.
   *
   * @param message - Optional message to display (uses current formatted text if not provided)
   * @param progress - Optional progress value (for horizontal/vertical modes)
   * @returns This builder for chaining
   */
  update(message?: string, progress?: number): this {
    if (!this._emitter.emitEnabled) {
      return this; // SUPPRESSED mode
    }

    if ((this._emitter as ProgressEmitter).progressEnabled && this.#state.line?.isActive) {
      // PROGRESS mode: Update in-place
      const text = message ?? this.format();
      this.#state.line.update(text, progress);
    } else if (this._emitter.emitEnabled) {
      // EMIT mode: Emit as regular log
      if (message) {
        this.text(message).emit();
      } else {
        this.emit();
      }
    }

    return this;
  }

  /**
   * Complete the progress and show final message.
   *
   * In progress mode, clears the progress indicator and shows final text.
   * In emit mode, emits a final log message.
   *
   * @param finalText - Optional final message (uses current message if not provided)
   * @returns This builder for chaining
   */
  complete(finalText?: string): this {
    if (!this._emitter.emitEnabled) {
      return this; // SUPPRESSED mode
    }

    if ((this._emitter as ProgressEmitter).progressEnabled && this.#state.line?.isActive) {
      // PROGRESS mode: Stop progress line
      const elapsed = this.#state.startTime ? Math.round((performance.now() - this.#state.startTime) / 10) / 100 : 0;

      let text = finalText ?? this.format();
      if (elapsed > 0) {
        text += ` (${elapsed}s)`;
      }

      this.#state.line.stop(text);
      this.#state.isActive = false;
      this.#state.line = undefined;
      this.#state.startTime = undefined;
    } else if (this._emitter.emitEnabled) {
      // EMIT mode: Emit final message
      if (finalText) {
        this.text(finalText).emit();
      } else {
        this.emit();
      }
    }

    return this;
  }

  /**
   * Stop progress without completing (for errors/cancellation).
   *
   * Clears any active progress indicator without showing final text.
   *
   * @returns This builder for chaining
   */
  cancel(): this {
    if (this.#state.line?.isActive) {
      this.#state.line.stop();
      this.#state.isActive = false;
      this.#state.line = undefined;
      this.#state.startTime = undefined;
    }
    return this;
  }

  /**
   * Check if progress is currently active.
   */
  get isProgressActive(): boolean {
    return this.#state.isActive;
  }

  /**
   * Get the shared progress state.
   * Use this to check if progress is active across builder instances.
   */
  get progressState(): ProgressState {
    return this.#state;
  }
}

/**
 * Factory function to create ProgressMsgBuilder with shared state.
 *
 * Use this factory when configuring your LogMgr to use ProgressMsgBuilder:
 *
 * @example
 * ```typescript
 * const logMgr = new Log.Mgr();
 *
 * logMgr.msgBuilderFactory = (emitter) =>
 *   new ProgressMsgBuilder(emitter);
 * ```
 */
export function createProgressBuilder(
  emitter: ConstructorParameters<typeof ProgressMsgBuilder>[0],
  state?: ProgressState,
): ProgressMsgBuilder {
  return new ProgressMsgBuilder(emitter, state);
}
