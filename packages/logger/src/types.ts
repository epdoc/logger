import type * as Level from '$level';
import type * as MsgBuilder from '$msgbuilder';
import type { TimestampFormat } from './consts.ts';

/**
 * A type representing the allowed values for timestamp formatting.
 * @see {@link TimestampFormat}
 */
export type TimestampFormatType = typeof TimestampFormat[keyof typeof TimestampFormat];

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
  pkg?: string;
  /** The log message, which can be a simple string or a formatable object. */
  msg: string | MsgBuilder.IFormatter | undefined;
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
  timestamp?: TimestampFormatType;
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
  pkg?: boolean | number;
  /** Controls the display of structured data. */
  data?: boolean;
  reqIdSep?: string;
  pkgSep?: string;
};

/**
 * A type representing the valid keys for {@link EmitterShowOpts}.
 */
export type EmitterShowKey = keyof EmitterShowOpts;

/**
 * Defines the constructor options for configuring a {@link LogMgr} instance.
 */
export type ILogMgrSettings = Partial<{
  /**
   * Options for controlling the visibility of different metadata fields in the final log output.
   */
  show: EmitterShowOpts;
}>;
