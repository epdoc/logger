/**
 * Terminal progress line implementation for TTY environments.
 *
 * Updates output in-place using ANSI escape codes.
 */
import { ANSI } from './const.ts';
import type { ProgressLine } from './types.ts';

/**
 * Progress line implementation for interactive terminals.
 * Updates output in-place without creating new lines.
 */
export class TerminalProgressLine implements ProgressLine {
  #isActive = false;
  #lastLength = 0;

  /**
   * Start displaying progress.
   * Hides cursor and outputs initial text.
   */
  start(text: string): void {
    this.#isActive = true;
    this.#lastLength = text.length;
    // Hide cursor and output initial text
    Deno.stderr.writeSync(new TextEncoder().encode(ANSI.HIDE_CURSOR + text));
  }

  /**
   * Update the progress display.
   * Clears the current line and writes new text.
   */
  update(text: string): void {
    if (!this.#isActive) return;

    // Clear to end of line and write new text
    const output = ANSI.CARRIAGE_RETURN + ANSI.CLEAR_TO_END + text;
    Deno.stderr.writeSync(new TextEncoder().encode(output));
    this.#lastLength = text.length;
  }

  /**
   * Stop and clear the progress display.
   * Shows cursor and optionally outputs final text.
   */
  stop(finalText?: string): void {
    if (!this.#isActive) return;

    let output = ANSI.CARRIAGE_RETURN + ANSI.CLEAR_TO_END;
    if (finalText) {
      output += finalText + '\n';
    }
    output += ANSI.SHOW_CURSOR;

    Deno.stderr.writeSync(new TextEncoder().encode(output));
    this.#isActive = false;
  }

  /**
   * Check if this progress line is currently active.
   */
  get isActive(): boolean {
    return this.#isActive;
  }
}

/**
 * Progress line implementation for non-TTY environments.
 * Emits log messages instead of updating in-place.
 */
export class LoggerProgressLine implements ProgressLine {
  #isActive = false;
  #lastText = '';

  /**
   * Start displaying progress.
   * In non-TTY mode, this just stores the text but doesn't output yet.
   */
  start(text: string): void {
    this.#isActive = true;
    this.#lastText = text;
  }

  /**
   * Update the progress display.
   * In non-TTY mode, emits a log message.
   */
  update(text: string): void {
    if (!this.#isActive) return;
    this.#lastText = text;
    // In non-TTY mode, we just store the text
    // The caller will emit via normal log methods
  }

  /**
   * Stop and clear the progress display.
   * In non-TTY mode, this just marks as inactive.
   */
  stop(finalText?: string): void {
    if (!this.#isActive) return;
    if (finalText) {
      this.#lastText = finalText;
    }
    this.#isActive = false;
  }

  /**
   * Get the current progress text.
   * Useful for emitting as a log message.
   */
  get text(): string {
    return this.#lastText;
  }

  /**
   * Check if this progress line is currently active.
   */
  get isActive(): boolean {
    return this.#isActive;
  }
}
