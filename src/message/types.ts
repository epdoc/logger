import type { Name as LevelName } from '../levels/types.ts';
import type * as Logger from '../loggers/mod.ts';
import type * as Transport from '../transports/types.ts';
import type { Entry } from '../types.ts';
import type * as Base from './base/mod.ts';

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
export interface IFormat {
  /**
   * Formats the message based on the specified color and target format.
   * @param {boolean} color - Whether to apply color styling.
   * @param {Transport.OutputFormatType} target - The output format.
   * @returns {string} The formatted message string.
   */
  format(color: boolean, target: Transport.OutputFormatType): string;
  /**
   * Appends a message part to the end of the message.
   * @param {string} str - The string content to append.
   * @param {StyleFormatterFn | null} [style] - The style to apply.
   * @returns {IFormat} The current instance for method chaining.
   */
  appendMsgPart(str: string, style?: StyleFormatterFn | null): IFormat;
  /**
   * Prepends a message part to the beginning of the message.
   * @param {string} str - The string content to prepend.
   * @param {StyleFormatterFn | null} [style] - The style to apply.
   * @returns {IFormat} The current instance for method chaining.
   */
  prependMsgPart(str: string, style?: StyleFormatterFn | null): IFormat;
}

/**
 * Interface for emitting a log message with a duration.
 */
export interface IEmitDuration {
  /**
   * Emits the log entry with a timestamp indicating the duration.
   * @param {number | string} duration - The duration in milliseconds or a string identifier for a marked time.
   * @returns {Entry | undefined} The emitted log entry, or `undefined` if not emitted.
   */
  // emitWithTime(duration: number | string): Entry | undefined;
  /**
   * Emits a message with the elapsed time since the last mark.
   * @param {number | string} duration - The time duration in milliseconds or a string identifier for a marked time.
   * @param {boolean} [keep=false] - Whether to keep the mark after demarking.
   * @returns {Entry | undefined} The emitted log entry, or `undefined` if not emitted.
   */
  ewt(duration: number | string, keep?: boolean): Entry | undefined;
}

/**
 * A factory method for creating a message builder instance.
 * @param {LevelName} level - The log level.
 * @param {Logger.IEmitter} emitter - The log emitter.
 * @param {boolean} meetsThreshold - Whether the log level meets the threshold.
 * @param {boolean} meetsFlushThreshold - Whether the log level meets the flush threshold.
 * @returns {Base.Builder} A new message builder instance.
 */
export type FactoryMethod = (
  level: LevelName,
  emitter: Logger.Base.IEmitter,
  meetsThreshold: boolean,
  meetsFlushThreshold: boolean,
) => Base.Builder;

/**
 * A constructor for a message builder class.
 * @template M - The type of the message builder.
 */
export type ClassConstructor<M> = new (level: string, logger: Logger.Base.IEmitter) => M;
