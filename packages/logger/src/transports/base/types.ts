import type { EmitterShowOpts } from '../../types.ts';

/**
 * Defines the common configuration options for any transport.
 */
export interface BaseOptions {
  /**
   * Overrides the default visibility settings for log metadata.
   * @see {@link Log.EmitterShowOpts}
   */
  show?: EmitterShowOpts;
}
