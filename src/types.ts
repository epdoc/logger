import type { TimestampFormat } from './consts.ts';
import type * as Level from './levels/mod.ts';
import type * as Logger from './logger/mod.ts';
import type * as MsgBuilder from './message/mod.ts';
import type * as Transport from './transports/mod.ts';

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
  reqIds?: string;
  /** A namespace, such as a class or module name, for context. */
  pkgs?: string;
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
 * Defines the options for configuring a {@link LogMgr} instance.
 *
 * @template L - The type of the logger that this manager will produce.
 */
export type MgrOpts<L extends Logger.Base.IEmitter, M extends MsgBuilder.Base.IBuilder> = Partial<{
  /**
   * Options for controlling the visibility of different metadata fields in the final log output.
   */
  show: EmitterShowOpts;
  /**
   * The minimum log level required for messages to be processed.
   */
  threshold: Level.Name;
  /**
   * A factory method for creating log level configurations.
   */
  levels: Level.FactoryMethod;
  /**
   * A factory method for creating message builders.
   */
  msgBuilderFactory: MsgBuilder.FactoryMethod;
  /**
   * A factory method for creating logger instances.
   */
  loggerFactory: Logger.FactoryMethod<L>;
  /**
   * An array of transport instances to which log messages will be sent.
   */
  transports: Transport.Base.Transport<M>[];
}>;
