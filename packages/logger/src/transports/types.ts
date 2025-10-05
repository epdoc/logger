import type { HrMilliseconds } from '@epdoc/duration';
import type { OutputFormat } from './consts.ts';

/**
 * A type representing the allowed values for transport output formatting.
 * @see {@link OutputFormat}
 */
export type OutputFormatType = typeof OutputFormat[keyof typeof OutputFormat];

/**
 * Represents a log entry after it has been partially formatted for transport output. This is different from Log.Entry.
 *
 * @remarks
 * This type is used internally by transports to represent a log entry where
 * some fields (like the timestamp) may have already been converted to strings.
 * @internal
 */
export type TransportEntry = Partial<{
  /** The log level name. */
  level: string;
  /** The formatted timestamp string. */
  timestamp: string;
  /** The response time to be displayed. */
  time: HrMilliseconds;
  /** The package name. */
  pkg: string;
  /** The session ID. */
  sid: string;
  /** The request ID. */
  reqId: string;
  /** The formatted log message. */
  msg: string;
  /** Structured data associated with the log. */
  data: unknown;
}>;
