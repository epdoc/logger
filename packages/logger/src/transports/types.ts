import type { HrMilliseconds } from '@epdoc/duration';
import type * as Level from '@epdoc/loglevels';
import type { EmitterShowOpts } from '../types.ts';
import type { OutputFormat } from './consts.ts';

/**
 * Interface defining the context from LogMgr that transports need access to.
 * This allows transports to be decoupled from the generic LogMgr<M>.
 */
export interface IBaseOptions {
  logLevels: Level.LogLevels;
  threshold: Level.Spec;
  show: EmitterShowOpts;
  startTime: Date;
}

export interface IExtendedOptions {
  /** If specified, these override the value set in TransportBaseOptions */
  threshold?: Level.Spec;
  /** If specified, these override the value set in TransportBaseOptions */
  show?: EmitterShowOpts;
}

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
 * some fields (like the timestamp) will already been converted to strings.
 * @internal
 */
export type Entry = Partial<{
  /** The log level name. */
  level: Level.Spec;
  /** The formatted timestamp string. */
  timestamp: string;
  /** The package name. */
  pkg: string;
  /** The session ID. */
  sid: string;
  /** The request ID. */
  reqId: string;
  /** The formatted log message. */
  msg: string;
  /** The response time to be displayed. */
  time: HrMilliseconds;
  /** Structured data associated with the log. */
  data: unknown;
}>;
