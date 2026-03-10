/**
 * Types and options for progress indicators in CLI applications.
 *
 * This module provides types for configuring progress bars, spinners,
 * and other progress indicators that work with the logging system.
 */

/**
 * Options for configuring a progress bar display.
 */
export interface ProgressBarOpts {
  /** Width of the progress bar in characters (default: 40) */
  width?: number;
  /** Character for completed portions (default: '█') */
  completeChar?: string;
  /** Character for incomplete portions (default: '░') */
  incompleteChar?: string;
  /** Show percentage (default: true) */
  showPercent?: boolean;
  /** Show count as "current/total" (default: true) */
  showCount?: boolean;
  /** Label to display before the progress bar */
  label?: string;
  /** Suffix to display after the progress bar (e.g., filename) */
  suffix?: string;
}

/**
 * Options for configuring a spinner display.
 */
export interface SpinnerOpts {
  /** Spinner animation frames (default: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']) */
  frames?: string[];
  /** Interval between frames in ms (default: 80) */
  interval?: number;
  /** Text to display after the spinner */
  text?: string;
}

/**
 * Represents the current state of progress for a single task.
 */
export interface TaskProgress {
  /** Task identifier */
  id: string;
  /** Task description */
  label: string;
  /** Current progress value */
  current: number;
  /** Total expected value */
  total: number;
  /** Status message */
  status?: string;
}

/**
 * Style presets for progress bars.
 */
export type ProgressBarStyle = 'default' | 'minimal' | 'blocks' | 'arrows' | 'custom';

/**
 * Configuration for progress bar styles.
 */
export interface ProgressBarStyleConfig {
  completeChar: string;
  incompleteChar: string;
}

/**
 * Predefined spinner animations.
 */
export type SpinnerType = 'dots' | 'line' | 'arrow' | 'bounce' | 'custom';

/**
 * Shared state for progress tracking across multiple MsgBuilder instances.
 *
 * This state is shared because each `.start()`, `.update()`, `.stop()` call
 * creates a new MsgBuilder instance, but they need to reference the same
 * progress line or state.
 */
export interface ProgressState {
  /** The active progress line/output handler */
  line?: ProgressLine;
  /** Timestamp when progress started (for elapsed time) */
  startTime?: number;
  /** Whether progress is currently active */
  isActive: boolean;
}

/**
 * Interface for progress line/output implementations.
 *
 * Different implementations can provide different rendering strategies:
 * - TerminalProgressLine: Updates in-place for TTY terminals
 * - LoggerProgressLine: Emits log messages for non-TTY
 */
export interface ProgressLine {
  /** Start displaying progress */
  start(text: string): void;
  /** Update the progress display */
  update(text: string): void;
  /** Stop and clear the progress display */
  stop(finalText?: string): void;
  /** Check if this progress line is currently active */
  readonly isActive: boolean;
}
