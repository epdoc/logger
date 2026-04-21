import type { DateTime } from '@epdoc/datetime';
import type { HrMilliseconds } from '@epdoc/duration';
import type * as Level from '@epdoc/loglevels';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import type { Integer } from '@epdoc/type';
import type { TimestampFormat } from './consts.ts';
import type { TransportMgr } from './transports/mgr.ts';

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
  level: Level.Spec;
  /** The timestamp of when the log entry was created. */
  timestamp?: DateTime;
  /** A namespace, such as a class or module name, for context. */
  pkg?: string;
  /** A session identifier, often tied to a user. */
  sid?: string;
  /** A unique identifier for a specific request or operation. */
  reqId?: string;
  /** The log message, which can be a simple string or a formatable object. */
  msg: string | MsgBuilder.IFormatter | undefined;
  /** A 'response time' to be output by the transport. */
  hrMsTime?: HrMilliseconds;
  /** Any structured data associated with the log entry. */
  data?: unknown | undefined;
  /** The number of spaces to output between parts of a message, defaults to 1 */
  msgSep?: Integer;
};

/**
 * Defines options for controlling the visibility of different metadata fields
 * in the final log output.
 */
export type EmitterShowOpts = {
  /**
   * Controls the display of the log level.
   * - `true`: Show the full level name (e.g., 'info').
   * - `number`: Show a truncated version of the level name, truncated to this many characters.
   * - `false` (or omitted): Do not show the level.
   */
  level?: boolean | number | 'icon';
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
  /** Show the response time for this operation */
  time?: boolean;
  /** The separater to show between package names (defaults to '.', which is set in the class LogMgr) */
  pkgSep?: string;
  /** If set to false, will suppress color in any Transports that support color by default (eg. Console). */
  color?: boolean;
  /**
   * Default number of spaces between message parts when formatting a log message.
   * Can be overridden per-logger via `logger.sep(n)`. Defaults to 1.
   */
  msgSep?: Integer;
  /**
   * Separator string between transport-level columns (timestamp, level, pkg, msg, time, data).
   * Defaults to a single space `' '`.
   */
  columnSep?: string;
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

export type LogEmitterContext = {
  sid?: string;
  reqId?: string;
  pkgs: string[];
  pkgSep: string;
};

export interface LogEmitterOpts {
  level: Level.Spec;
  context: LogEmitterContext;
  msgSep: Integer;
  /** Direct reference to TransportMgr for emitting entries */
  transportMgr: TransportMgr;
  /**
   * Indicates if this log level is at the exact threshold for progress mode.
   *
   * Progress mode is only enabled when:
   * 1. The log level exactly matches the LogMgr threshold
   * 2. At least one ConsoleTransport is registered
   *
   * When enabled, progress indicators (spinners, progress bars) can be shown
   * instead of emitting normal log messages. This allows for interactive progress
   * display at the threshold level. Progress output goes to STDERR while normal
   * logs respect the transport's configured output stream.
   *
   * When false but emitEnabled is true, normal log emission should occur.
   */
  progressEnabled: boolean;
  demark?: (name: string, keep?: boolean) => number;
}

/**
 * Defines the parameters for creating a child logger.
 */
export interface IGetChildParams {
  /**
   * A session identifier, often tied to a user.
   */
  sid?: string;
  /**
   * A unique identifier for a request or operation.
   */
  reqId?: string;
  /**
   * A namespace, such as a class or module name.
   */
  pkg?: string;
}
