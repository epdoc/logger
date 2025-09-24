/**
 * @module
 * Defines the core `IBasic` interface for a log level management system.
 */

import type { Integer } from '@epdoc/type';
import type { LogLevelsDef, Name, Value } from './types.ts';

/**
 * Defines the core contract for a log level management system.
 *
 * @remarks
 * This interface specifies the essential methods and properties required to handle
 * a collection of log levels. Any class that implements `IBasic` can be used by
 * the `LogMgr` to manage level-to-value conversions, threshold checks, and
 * formatting.
 *
 * This allows for different sets of log levels (e.g., a simple set for standard
 * logging, a more verbose set for CLI tools) to be used interchangeably.
 */
export interface IBasic {
  readonly $$id: string;
  /**
   * An array of all defined log level names, typically in uppercase.
   */
  readonly names: Name[];

  /**
   * The name of the default log level (e.g., 'INFO').
   */
  readonly defaultLevelName: Name;

  /**
   * The name of the lowest-priority log level.
   */
  readonly lowestLevelName: Name;

  /**
   * The name of the warning log level.
   */
  readonly warnLevelName: Name;

  /**
   * The raw definition object that configures all log levels.
   */
  readonly levelDefs: LogLevelsDef;

  /**
   * Converts a log level name or numeric value to its corresponding numeric value.
   *
   * @param {Name | Value} level - The log level to convert.
   * @returns {Value} The numeric value of the log level.
   * @throws {Error} If the level name or value is not defined.
   */
  asValue(level: Name | Value): Value;

  /**
   * Converts a log level numeric value or name to its corresponding name.
   *
   * @param {Name | Value} level - The log level to convert.
   * @returns {Name} The name of the log level.
   * @throws {Error} If the level value or name is not defined.
   */
  asName(level: Name | Value): Name;

  /**
   * Checks if a given log level meets or exceeds a specified threshold.
   *
   * @param {Value | Name} level - The log level to check.
   * @param {Value | Name} threshold - The threshold to compare against.
   * @returns {boolean} `true` if the log level meets the threshold.
   */
  meetsThreshold(level: Value | Name, threshold: Value | Name): boolean;

  /**
   * Performs the numeric comparison to check if a level meets a threshold.
   *
   * @param {Value} levelVal - The numeric value of the log level.
   * @param {Value} thresholdVal - The numeric value of the threshold.
   * @returns {boolean} `true` if the level meets the threshold.
   * @internal
   */
  meetsThresholdValue(levelVal: Value, thresholdVal: Value): boolean;

  /**
   * Checks if a log level is configured to trigger an immediate flush.
   *
   * @param {Value | Name} level - The log level to check.
   * @returns {boolean} `true` if the level requires an immediate flush.
   */
  meetsFlushThreshold(level: Value | Name): boolean;

  /**
   * Calculates the maximum character width of all log level names up to a given
   * threshold, for formatting purposes.
   *
   * @param {Value | Name} threshold - The highest log level to consider.
   * @returns {Integer} The maximum width of the level names.
   */
  maxWidth(threshold: Value | Name): Integer;

  /**
   * Applies a level-specific color formatting function to a message.
   *
   * @param {string} msg - The message to format.
   * @param {Name} level - The log level of the message.
   * @returns {string} The formatted (potentially colored) message.
   */
  applyColors(msg: string, level: Name): string;
}
