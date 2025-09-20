import type { Dict } from '@epdoc/type';

export interface IEmitter {
  dataEnabled: boolean;
  emitEnabled: boolean;
  stackEnabled: boolean;
  emit: (msg: EmitterData) => EmitterData;
  // demark: (name?: string, keep?: boolean) => void;
}

export type EmitterData = {
  timestamp: Date;
  formatter: IFormatter;
  data: Dict | undefined;
};

export type EmitterTarget = 'console' | 'json' | 'jsonArray';

export type FormatOpts = {
  color?: boolean;
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
