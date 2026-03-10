/**
 * ProgressMsgBuilder - Extends Console.Builder with progress indicator support.
 *
 * This class provides methods for displaying progress bars, spinners, and other
 * progress indicators in CLI applications. It integrates with the logger's
 * progress mode to show interactive progress in TTY terminals or fall back to
 * regular log messages in non-TTY environments.
 *
 * @example
 * ```typescript
 * class MyContext extends CliApp.Ctx.AbstractBase<ProgressMsgBuilder, Logger> {
 *   protected override builderClass = ProgressMsgBuilder;
 * }
 *
 * // In your command:
 * async execute(): Promise<void> {
 *   const files = await this.getFiles();
 *   
 *   // Show progress bar
 *   for (let i = 0; i < files.length; i++) {
 *     this.log.info
 *       .label('Processing')
 *       .progress(i + 1, files.length, { label: files[i] })
 *       .update();
 *     
 *     await processFile(files[i]);
 *   }
 *   
 *   this.log.info.complete('All files processed!').emit();
 * }
 * ```
 */
import { Console } from '@epdoc/msgbuilder';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { isNumber } from '@epdoc/type';
import {
  ANSI,
  DEFAULT_PROGRESS_WIDTH,
  DEFAULT_SPINNER_INTERVAL,
  PROGRESS_BAR_STYLES,
  SPINNER_FRAMES,
} from './const.ts';
import { LoggerProgressLine, TerminalProgressLine } from './line.ts';
import type {
  ProgressBarOpts,
  ProgressLine,
  ProgressState,
  SpinnerOpts,
} from './types.ts';

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
 * This is shared across all ProgressMsgBuilder instances to maintain
 * state between .start(), .update(), and .stop() calls.
 */
const globalProgressState: ProgressState = {
  isActive: false,
};

/**
 * Message builder with progress indicator support.
 *
 * Extends Console.Builder with methods for displaying progress bars, spinners,
 * and updating progress in-place. Automatically detects TTY capability and
 * falls back to regular log messages in non-interactive environments.
 */
export class ProgressMsgBuilder extends Console.Builder {
  #state: ProgressState;
  #spinnerInterval?: number;
  #currentSpinnerFrame = 0;

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
   * Configure a progress bar with current/total values.
   *
   * @param current - Current progress value
   * @param total - Total expected value
   * @param opts - Progress bar display options
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * this.log.info.progress(50, 100, { label: 'Downloading', width: 30 }).update();
   * ```
   */
  progress(current: number, total: number, opts: ProgressBarOpts = {}): this {
    if (!isNumber(current) || !isNumber(total) || total <= 0) {
      return this;
    }

    const width = opts.width ?? DEFAULT_PROGRESS_WIDTH;
    const style = PROGRESS_BAR_STYLES[opts.completeChar ? 'custom' : 'default'];
    const completeChar = opts.completeChar ?? style.complete;
    const incompleteChar = opts.incompleteChar ?? style.incomplete;

    const percent = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
    const filled = Math.round((current / total) * width);
    const empty = width - filled;

    const bar = completeChar.repeat(filled) + incompleteChar.repeat(empty);

    let text = '';
    if (opts.label) {
      text += opts.label + ' ';
    }
    text += `[${bar}]`;
    if (opts.showPercent !== false) {
      text += ` ${percent}%`;
    }
    if (opts.showCount !== false) {
      text += ` (${current}/${total})`;
    }
    if (opts.suffix) {
      text += ' ' + opts.suffix;
    }

    return this.text(text);
  }

  /**
   * Configure an indeterminate spinner.
   *
   * @param opts - Spinner options
   * @returns This builder for chaining
   *
   * @example
   * ```typescript
   * this.log.info.spinner({ text: 'Loading...' }).start();
   * ```
   */
  spinner(opts: SpinnerOpts = {}): this {
    const frames = opts.frames ?? SPINNER_FRAMES.dots;
    const frame = frames[this.#currentSpinnerFrame % frames.length];

    let text = frame;
    if (opts.text) {
      text += ' ' + opts.text;
    }

    return this.text(text);
  }

  /**
   * Start displaying progress.
   *
   * In progress mode (TTY), shows an interactive progress indicator.
   * In emit mode, emits a regular log message.
   * In suppressed mode, does nothing.
   *
   * @returns This builder for chaining
   */
  start(): this {
    // Check if we should emit at all
    if (!this._emitter.emitEnabled) {
      return this; // SUPPRESSED mode
    }

    // If there's already an active progress line, stop it first
    if (this.#state.line?.isActive) {
      this.#state.line.stop();
    }

    if ((this._emitter as ProgressEmitter).progressEnabled) {
      // PROGRESS mode: Show interactive progress
      this.#state.line = new TerminalProgressLine();
      this.#state.startTime = performance.now();
      this.#state.isActive = true;
      this.#state.line.start(this.format());
    } else {
      // EMIT mode: Normal log emission
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
   * @returns This builder for chaining
   */
  update(): this {
    if (!this._emitter.emitEnabled) {
      return this; // SUPPRESSED mode
    }

    if ((this._emitter as ProgressEmitter).progressEnabled && this.#state.line?.isActive) {
      // PROGRESS mode: Update in-place
      this.#state.line.update(this.format());
    } else if (this._emitter.emitEnabled) {
      // EMIT mode: Emit as regular log
      this.emit();
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
      const elapsed = this.#state.startTime
        ? Math.round((performance.now() - this.#state.startTime) / 10) / 100
        : 0;

      let text = finalText ?? this.format();
      if (elapsed > 0) {
        text += ` (${elapsed}s)`;
      }

      this.#state.line.stop(text);
      this.#state.isActive = false;
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
   * Advance spinner to next frame.
   * Call this before update() to animate spinners.
   *
   * @returns This builder for chaining
   */
  nextFrame(): this {
    this.#currentSpinnerFrame++;
    return this;
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
 * const progressState = { isActive: false };
 *
 * logMgr.msgBuilderFactory = (emitter) =>
 *   new Progress.Builder(emitter, progressState);
 * ```
 */
export function createProgressBuilder(
  emitter: ConstructorParameters<typeof ProgressMsgBuilder>[0],
  state?: ProgressState,
): ProgressMsgBuilder {
  return new ProgressMsgBuilder(emitter, state);
}
