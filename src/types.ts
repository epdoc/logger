import { isString } from '@epdoc/type';
import type * as Level from './levels/types.ts';
import type * as MsgBuilder from './message/types.ts';

/**
 * Defines the available formats for displaying timestamps in log output.
 */
export const TimestampFormat = {
  /** Coordinated Universal Time (UTC) format. */
  UTC: 'utc',
  /** Local time zone format. */
  LOCAL: 'local',
  /** Time elapsed since the logger was initialized. */
  ELAPSED: 'elapsed',
} as const;

/**
 * A type representing the allowed values for timestamp formatting.
 * @see {@link TimestampFormat}
 */
export type TimestampFormat = typeof TimestampFormat[keyof typeof TimestampFormat];

const timestampFormatValues = Object.values(TimestampFormat);

/**
 * Type guard to check if a value is a valid {@link TimestampFormat}.
 *
 * @param {unknown} val - The value to check.
 * @returns {boolean} `true` if the value is a valid timestamp format.
 * @internal
 */
export function isTimestampFormat(val: unknown): val is TimestampFormat {
  return isString(val) && (timestampFormatValues as readonly string[]).includes(val);
}

/**
 * Represents a single, complete log entry.
 *
 * @remarks
 * This is the core data structure that is passed from the logger, through the
 * log manager, and finally to the transports.
 */
export type Entry = {
  /** The severity level of the log entry. */
  level: Level.Name;
  /** The timestamp of when the log entry was created. */
  timestamp?: Date;
  /** A session identifier, often tied to a user. */
  sid?: string;
  /** A unique identifier for a specific request or operation. */
  reqId?: string;
  /** A namespace, such as a class or module name, for context. */
  package?: string;
  /** The log message, which can be a simple string or a formatable object. */
  msg: string | MsgBuilder.IFormat | undefined;
  /** Any structured data associated with the log entry. */
  data?: unknown | undefined;
};

/**
 * Defines options for controlling the visibility of different metadata fields
 * in the final log output.
 */
export type EmitterShowOpts = {
  /**
   * Controls the display of the log level.
   * - `true`: Show the full level name (e.g., 'info').
   * - `number`: Show a truncated version of the level name.
   * - `false` (or omitted): Do not show the level.
   */
  level?: boolean | number;
  /** Controls the display format of the timestamp. */
  timestamp?: TimestampFormat;
  /** Controls the display of the session ID. */
  sid?: boolean;
  /**
   * Controls the display of the request ID.
   * - `true`: Show the full request ID.
   * - `number`: Show a truncated version of the request ID.
   * - `false` (or omitted): Do not show the request ID.
   */
  reqId?: boolean | number;
  /**
   * Controls the display of the package name.
   * - `true`: Show the full package name.
   * - `number`: Show a truncated version of the package name.
   * - `false` (or omitted): Do not show the package name.
   */
  package?: boolean | number;
  /** Controls the display of structured data. */
  data?: boolean;
};

/**
 * A type representing the valid keys for {@link EmitterShowOpts}.
 */
export type EmitterShowKey = keyof EmitterShowOpts;
