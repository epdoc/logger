/**
 * Constants for progress indicators.
 */

/**
 * Default progress bar width in characters.
 */
export const DEFAULT_PROGRESS_WIDTH = 40;

/**
 * Predefined progress bar styles.
 */
export const PROGRESS_BAR_STYLES: Record<string, { complete: string; incomplete: string }> = {
  /** Default solid blocks */
  default: { complete: '█', incomplete: '░' },
  /** Minimal using equals and space */
  minimal: { complete: '=', incomplete: ' ' },
  /** Larger blocks */
  blocks: { complete: '▓', incomplete: '░' },
  /** Arrow style */
  arrows: { complete: '▶', incomplete: '▷' },
  /** Hash style */
  hash: { complete: '#', incomplete: '-' },
};

/**
 * Predefined spinner animations.
 */
export const SPINNER_FRAMES: Record<string, string[]> = {
  /** Classic braille dots spinner */
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  /** Simple rotating line */
  line: ['-', '\\', '|', '/'],
  /** Rotating arrows */
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  /** Bouncing ball */
  bounce: ['( ●    )', '(  ●   )', '(   ●  )', '(    ● )', '(   ●  )', '(  ●   )', '( ●    )', '(●     )'],
  /** Growing/shrinking square */
  square: ['◰', '◳', '◲', '◱'],
  /** Pulse */
  pulse: ['◐', '◓', '◑', '◒'],
};

/**
 * Default spinner interval in milliseconds.
 */
export const DEFAULT_SPINNER_INTERVAL = 80;

/**
 * ANSI escape codes for terminal control.
 */
export const ANSI = {
  /** Clear current line */
  CLEAR_LINE: '\x1b[2K',
  /** Move cursor to beginning of line */
  CARRIAGE_RETURN: '\r',
  /** Hide cursor */
  HIDE_CURSOR: '\x1b[?25l',
  /** Show cursor */
  SHOW_CURSOR: '\x1b[?25h',
  /** Move cursor up one line */
  CURSOR_UP: '\x1b[1A',
  /** Move cursor down one line */
  CURSOR_DOWN: '\x1b[1B',
  /** Clear from cursor to end of line */
  CLEAR_TO_END: '\x1b[K',
} as const;
