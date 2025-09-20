import type { Dict } from '@epdoc/type';

/**
 * Defines the interface for an emitter, which is responsible for outputting log messages.
 */
export interface IEmitter {
  /**
   * Indicates if data payloads are enabled for emission as part of the message string. An
   * application using a MsgBuilder may want to handle data at a higher level when emit is called.
   */
  dataEnabled: boolean;
  /**
   * Indicates if the emitter is globally enabled. This may depend on log level settings. For
   * example, if this message is associated with a message at a VERBOSE log level, but the log
   * reporting level is set to INFO, then none of this message will be output and the code can take
   * execution shortcuts.
   */
  emitEnabled: boolean;
  /**
   * Indicates if stack traces are to be emitted when there is an error being logged. This may
   * depend on log level settings, for example an application might elect to emit a stack trace only
   * when the log level is at DEBUG or lower.
   */
  stackEnabled: boolean;
  /**
   * Emits a log message.
   * @param {EmitterData} msg - The data to be emitted.
   * @returns {EmitterData} The emitted data.
   */
  emit: (msg: EmitterData) => EmitterData;
  // demark: (name?: string, keep?: boolean) => void;
}

/**
 * Represents the data structure for a log message to be emitted.
 */
export type EmitterData = {
  /**
   * The timestamp of the log message.
   */
  timestamp: Date;
  /**
   * The formatter to be used for the log message.
   */
  formatter: IFormatter;
  /**
   * An optional data payload for the log message.
   */
  data: Dict | undefined;
};

/**
 * Defines the possible targets for log message emission.
 * - `console`: Human-readable console output.
 * - `json`: Single JSON object.
 * - `jsonArray`: An array of JSON objects.
 */
export type EmitterTarget = 'console' | 'json' | 'jsonArray';

/**
 * Options for formatting a log message.
 */
export type FormatOpts = {
  /**
   * Whether to apply color styling to the output.
   */
  color?: boolean;
  /**
   * The target format for the output.
   */
  target?: EmitterTarget;
};

/**
 * A function that applies styling to a string.
 * @param {string} str - The string to be styled.
 * @returns {string} The styled string.
 */
export type StyleFormatterFn = (str: string) => string;

/**
 * Represents the types of arguments that can be passed to styling methods.
 */
export type StyleArg = string | number | Record<string, unknown> | unknown[] | unknown;

/**
 * Represents a part of a log message with its content and style.
 */
export type MsgPart = {
  /**
   * The string content of the message part.
   */
  str: string;
  /**
   * The style formatter function to be applied to the string.
   */
  style?: StyleFormatterFn;
};

/**
 * Interface for formatting a log message.
 */
export interface IFormatter {
  /**
   * Formats the message based on the specified color and target format.
   * @param {boolean} color - Whether to apply color styling.
   * @param {Transport.OutputFormatType} target - The output format.
   * @returns {string} The formatted message string.
   */
  format(opts?: FormatOpts): string;
  /**
   * Appends a message part to the end of the message.
   * @param {string} str - The string content to append.
   * @param {StyleFormatterFn | null} [style] - The style to apply.
   * @returns {IFormatter} The current instance for method chaining.
   */
  appendMsgPart(str: string, style?: StyleFormatterFn | null): IFormatter;
  /**
   * Prepends a message part to the beginning of the message.
   * @param {string} str - The string content to prepend.
   * @param {StyleFormatterFn | null} [style] - The style to apply.
   * @returns {IFormatter} The current instance for method chaining.
   */
  prependMsgPart(str: string, style?: StyleFormatterFn | null): IFormatter;

  // demark(name:string,keep?: boolean) : HrMilliseconds
}

// /**
//  * A factory method for creating a message builder instance.
//  * @param {LevelName} level - The log level.
//  * @param {Logger.IEmitter} emitter - The log emitter.
//  * @param {boolean} meetsThreshold - Whether the log level meets the threshold.
//  * @param {boolean} meetsFlushThreshold - Whether the log level meets the flush threshold.
//  * @returns {Base.Builder} A new message builder instance.
//  */
// export type FactoryMethod = (
//   level: LevelName,
//   emitter: Logger.Base.IEmitter,
//   meetsThreshold: boolean,
//   meetsFlushThreshold: boolean,
// ) => Base.Builder;

// /**
//  * A constructor for a message builder class.
//  * @template M - The type of the message builder.
//  */
// export type ClassConstructor<M> = new (level: string, logger: Logger.Base.IEmitter) => M;
