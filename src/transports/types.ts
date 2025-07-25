import type * as Level from '../levels/types.ts';
import type * as Logger from '../logger/types.ts';
import type { AbstractMsgBuilder } from '../message/abstract.ts';
import type { IBasic as MsgBuilderIBasic } from '../message/types.ts';
import type * as Log from '../types.ts';

/**
 * Defines the available output formats for transports.
 */
export const OutputFormat = {
  /** Plain text format. */
  TEXT: 'text',
  /** Single-line JSON object format. */
  JSON: 'json',
  /** A format where each log entry is an element in a JSON array. */
  JSON_ARRAY: 'jsonArray',
} as const;

/**
 * A type representing the allowed values for transport output formatting.
 * @see {@link OutputFormat}
 */
export type OutputFormat = typeof OutputFormat[keyof typeof OutputFormat];

/**
 * Defines the basic contract for any log transport.
 * @deprecated This interface is legacy. New transports should extend the {@link Base} class.
 */
export interface IBasicTransport<M extends MsgBuilderIBasic> {
  /** The unique type identifier for the transport (e.g., 'console', 'file'). */
  get type(): string;
  /** Processes and outputs a log entry. */
  emit(msg: Log.Entry, logger: Logger.IEmitter): void;
  /** A hook that is called when the transport's threshold is updated. */
  thresholdUpdated(): IBasicTransport<M>;
  /** Checks if this transport is of the same type as another. */
  match(transport: IBasicTransport<M>): boolean;
  /** Initializes the transport. */
  open(callbacks: OpenCallbacks): Promise<void>;
  /** Indicates if the transport is ready to process messages. */
  get ready(): boolean;
  /** Gracefully shuts down the transport. */
  close(): Promise<void>;
  /** Clears any internal state or buffers. */
  clear(): void;
  /** Cleans up all resources used by the transport. */
  destroy(): Promise<void>;
  /** Indicates if the transport is currently active. */
  get alive(): boolean;
  /** Retrieves the transport's configuration options. */
  getOptions(): CreateOpts;
  /** Returns a string representation of the transport. */
  toString(): string;
}

/** A generic callback function with no arguments. */
export type FCallback = () => void;
/** A callback function for handling errors. */
export type FError = (error: Error) => void;

/**
 * Defines a set of callbacks for monitoring the transport's lifecycle.
 */
export type OpenCallbacks = {
  /** Called when the transport successfully opens. */
  onSuccess: FCallback;
  /** Called when an error occurs. */
  onError: FError;
  /** Called when the transport closes. */
  onClose: FCallback;
};

/**
 * Defines the creation options for a transport.
 */
export type CreateOpts = {
  /**
   * Controls the display of the session ID.
   * If not set, the `LogMgr`'s setting is used.
   */
  sid?: boolean;
  /**
   * Specifies the format for timestamps.
   * If not set, the `LogMgr`'s setting is used.
   */
  timestamp?: Log.TimestampFormat;
  /**
   * @deprecated This option is no longer used.
   */
  static?: boolean;
  /**
   * The log level threshold for this transport.
   */
  level?: string;
};

/**
 * Defines the factory function signature for creating transport instances.
 *
 * @template M - The type of message builder used by the logger.
 * @param {LogMgr<M>} logMgr - The log manager instance.
 * @returns {AbstractMsgBuilder<M>} A new transport instance.
 */
export interface IStaticMsgBuilder {
  create(level: Level.Name, emitter: Logger.IEmitter): AbstractMsgBuilder;
}

/**
 * Represents a log entry after it has been partially formatted for transport output.
 *
 * @remarks
 * This type is used internally by transports to represent a log entry where
 * some fields (like the timestamp) may have already been converted to strings.
 */
export type Entry = Partial<{
  /** The log level name. */
  level: string;
  /** The formatted timestamp string. */
  timestamp: string;
  /** The package name. */
  package: string;
  /** The session ID. */
  sid: string;
  /** The request ID. */
  reqId: string;
  /** The formatted log message. */
  msg: string;
  /** Structured data associated with the log. */
  data: unknown;
}>;
