import type { CompareResult, Integer } from '@epdoc/type';
import type * as LogLevel from './types.ts';

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
   * @deprecated
   */
  readonly names: LogLevel.Name[];

  /**
   * Checks if a given log level meets or exceeds a specified threshold.
   *
   * @param {Severity | Name} level - The log level to check.
   * @param {Severity | Name} threshold - The threshold to compare against.
   * @returns {boolean} 0 if the log level meets the threshold, +1 if the log level exceeds the
   * threshold, and -1 otherwise.
   * @deprecated Use compareLevels
   */
  compareThreshold(
    level: LogLevel.Spec | LogLevel.Severity | LogLevel.Name,
    threshold: LogLevel.Spec | LogLevel.Severity | LogLevel.Name,
  ): CompareResult;

  /**
   * Performs the numeric comparison to check if a level meets or exceeds a threshold.
   *
   * @param {Severity} levelVal - The numeric value of the log level.
   * @param {Severity} thresholdVal - The numeric value of the threshold.
   * @returns {boolean} 0 if the log level meets the threshold, +1 if the log level exceeds the
   * threshold, and -1 otherwise.
   * @deprecated Use compareLevels
   * @internal
   */
  compareThresholdValue(levelVal: LogLevel.Severity, thresholdVal: LogLevel.Severity): CompareResult;

  /**
   * Compares two log levels using Def objects.
   * Returns 0 if the levels are equal, +1 if the first level exceeds the second,
   * and -1 if the first level is below the second.
   *
   * @param {Def} level - The first log level to compare.
   * @param {Def} threshold - The second log level to compare against.
   * @returns {CompareResult} 0 if equal, +1 if level > threshold, -1 if level < threshold.
   */
  compareLevels(level: LogLevel.Spec, threshold: LogLevel.Spec): CompareResult;

  /**
   * Checks if a given log level meets or exceeds a specified threshold.
   *
   * @param {Def | Severity | Name} level - The log level to check.
   * @param {Def | Severity | Name} threshold - The threshold to compare against.
   * @returns {boolean} `true` if the log level meets the threshold.
   * @deprecated Use compareLevels
   */
  meetsThreshold(
    level: LogLevel.Spec | LogLevel.Severity | LogLevel.Name,
    threshold: LogLevel.Spec | LogLevel.Severity | LogLevel.Name,
  ): boolean;

  /**
   * Performs the numeric comparison to check if a level meets a threshold.
   *
   * @param {Severity} levelVal - The numeric value of the log level.
   * @param {Severity} thresholdVal - The numeric value of the threshold.
   * @returns {boolean} `true` if the level meets the threshold.
   * @internal
   */
  // meetsThresholdValue(levelVal: Value, thresholdVal: Value): boolean;

  /**
   * Checks if a log level is configured to trigger an immediate flush.
   *
   * @param {Def | Severity | Name} level - The log level to check.
   * @returns {boolean} `true` if the level requires an immediate flush.
   */
  meetsFlushThreshold(level: LogLevel.Spec | LogLevel.Severity | LogLevel.Name): boolean;

  /**
   * Calculates the maximum character width of all log level names up to a given
   * threshold, for formatting purposes.
   *
   * @param {Def | Severity | Name} threshold - The highest log level to consider.
   * @returns {Integer} The maximum width of the level names.
   */
  maxWidth(threshold: LogLevel.Spec | LogLevel.Severity | LogLevel.Name): Integer;

  /**
   * Applies a level-specific color formatting function to a message.
   *
   * @param {string} msg - The message to format.
   * @param {Name} level - The log level of the message.
   * @returns {string} The formatted (potentially colored) message.
   */
  applyColors(msg: string, level: LogLevel.Name): string;
}
