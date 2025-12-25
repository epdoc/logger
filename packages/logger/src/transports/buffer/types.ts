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
}

/**
 * A log entry stored in the buffer
 */
export interface IBufferEntry {
  /** The formatted log message */
  message: string;
  /** Timestamp when the entry was added */
  timestamp: Date;
  /** Log level */
  level: string;
  /** Raw log data if available */
  data?: unknown;
}
