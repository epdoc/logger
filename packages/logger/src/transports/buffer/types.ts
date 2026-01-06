/**
 * @file Buffer transport types for in-memory log capture
 */

import type { BaseOptions } from '../base/types.ts';

/**
 * Configuration options for the buffer transport
 */
export interface IBufferTransportOptions extends BaseOptions {
  /**
   * Maximum number of log entries to store in memory.
   * When exceeded, oldest entries are removed (FIFO).
   * @default 1000
   */
  maxEntries?: number;

  /**
   * Delay in milliseconds before marking the transport as ready.
   * Useful for testing message queuing behavior.
   * @default 0 (ready immediately)
   */
  delayReady?: number;
}
