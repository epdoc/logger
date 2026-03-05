/**
 * A reusable terminal progress indicator that shows a spinner and status message.
 * Writes to stderr to avoid interfering with stdout output.
 */

import { rgb24 } from '@std/fmt/colors';

const encoder = new TextEncoder();

export class ProgressLine {
  #frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  #intervalId?: number;
  #frameIndex = 0;
  #currentMessage = '';
  #isActive = false;

  /**
   * Start showing the progress indicator with a message.
   * @param message - The status message to display
   */
  start(message: string): void {
    if (this.#isActive) {
      this.stop();
    }

    this.#isActive = true;
    this.#currentMessage = message;
    this.#frameIndex = 0;

    // Show initial frame
    this.render();

    // Start animation
    this.#intervalId = setInterval(() => {
      this.#frameIndex = (this.#frameIndex + 1) % this.#frames.length;
      this.render();
    }, 80);
  }

  /**
   * Update the message without stopping the spinner.
   * @param message - The new status message to display
   */
  update(message: string): void {
    if (!this.#isActive) {
      return;
    }
    this.#currentMessage = message;
    this.render();
  }

  /**
   * Stop the progress indicator and optionally show a final message.
   * @param finalMessage - Optional final message to display (clears the line if not provided)
   */
  stop(finalMessage?: string): void {
    if (!this.#isActive) {
      return;
    }

    if (this.#intervalId !== undefined) {
      clearInterval(this.#intervalId);
      this.#intervalId = undefined;
    }

    this.#isActive = false;

    // Clear the line
    this.clearLine();

    // Show final message if provided
    if (finalMessage) {
      const output = `${finalMessage}\n`;
      Deno.stderr.writeSync(encoder.encode(output));
    }
  }

  /**
   * Render the current frame to stderr.
   */
  private render(): void {
    if (!this.#isActive) {
      return;
    }

    const spinner = this.#frames[this.#frameIndex];
    const output = `\r\x1b[K${rgb24(spinner, 0xD02020)} ${this.#currentMessage}`;
    Deno.stderr.writeSync(encoder.encode(output));
  }

  /**
   * Clear the current line.
   */
  private clearLine(): void {
    Deno.stderr.writeSync(encoder.encode('\r\x1b[K'));
  }
}
