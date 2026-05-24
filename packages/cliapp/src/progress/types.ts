/**
 * Types for progress integration with cliapp.
 *
 * This module provides types specific to the cliapp integration
 * with @epdoc/progress.
 */

import type * as Level from '@epdoc/loglevels';
import type * as Progress from '@epdoc/progress';

/**
 * Shared state for progress tracking across multiple MsgBuilder instances.
 *
 * This state is stored on LogMgr/Transport and shared because each `.start()`,
 * `.update()`, `.stop()` call creates a new MsgBuilder instance, but they
 * need to reference the same progress line.
 *
 * Only one progress can be active at a time.
 */
export interface ProgressState {
  /** The active progress line from @epdoc/progress */
  line?: Progress.Line;
  /** Timestamp when progress started (for elapsed time) */
  startTime?: number;
  /** Whether progress is currently active */
  isActive: boolean;
}

export type ProgressThreshold = { level?: Level.Name | Level.Severity | Level.Spec };

/**
 * Options for starting progress.
 *
 * All LineOptions fields are optional - if not specified, defaults to a
 * braille spinner. This allows users to call `.start()` without arguments
 * or with just a level constraint (e.g., `.start({ level: 'verbose' })`).
 */
export type StartOptions = ProgressThreshold & Partial<Progress.LineOptions>;
