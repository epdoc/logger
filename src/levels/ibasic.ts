import type { Integer } from '@epdoc/type';
import type { Name, Value } from './types.ts';

/**
 * Log levels interface used throughout the library, allowing for custom log
 * levels. A default implementation is provided by the `LogLevels` class, and is
 * accessed via the `DEFAULT_LOG_LEVELS_FACTORY_METHOD` constant.
 *
 * The Logger class implements methods for each log level (info, debug, etc..)
 * for each of the default logger levels. If you are using custom log levels,
 * you will need to subclasss the Logger class and implement the methods for
 * your log levels.
 */
export interface IBasic {
  /**
   * The array of log level names that are supported by the logger. These names
   * will be uppercased.
   * @type {Name[]}
   */
  names: Name[];
  // levelDefs: LogLevelDef;
  /**
   * Converts a log level name to its corresponding numeric value.
   * @param {Name} level - The name of the log level to convert.
   * @returns {Value} The numeric value of the log level.
   */
  asValue(level: Name | Value): Value;

  /**
   * Converts a numeric log level value to its corresponding name.
   * @param {Value} level - The numeric value of the log level to convert.
   * @returns {Name} The name of the log level.
   */

  asName(level: Name | Value): Name;
  /**
   * The name of the default log level. Usually this is "INFO"
   * @type {Name}
   */
  defaultLevelName: Name;

  /**
   * Checks if a log level meets a specified threshold.
   * @param {Value} level - The log level to check.
   * @param {Value} threshold - The threshold to compare against.
   * @returns {boolean} True if the log level is above the threshold, false otherwise.
   */
  meetsThreshold(level: Value | Name, threshold: Value | Name): boolean;

  /**
   * Checks if a log level should result in a flush.
   * @param {Name} level - The log level to check.
   * @returns {boolean} True if the log level is above the threshold, false otherwise.
   */
  meetsFlushThreshold(level: Value | Name): boolean;

  maxWidth(threshold: Value | Name): Integer;

  /**
   * Applies color formatting, if any, to a log message based on its level.
   * @param {string} msg - The message to format.
   * @param {Name} level - The log level associated with the message.
   * @returns {string} The formatted message with color applied.
   */
  applyColors(msg: string, level: Name): string;
}
