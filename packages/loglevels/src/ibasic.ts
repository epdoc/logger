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

  get defaultLevel(): LogLevel.Spec;
  get warnLevel(): LogLevel.Spec;
  get flushLevel(): LogLevel.Spec;

  asSpec(level: LogLevel.Spec | LogLevel.Name | LogLevel.Severity): LogLevel.Spec | null;

  /**
   * Checks if a given log level meets or exceeds a specified threshold.
   *
   * @param {Severity | Name} level - The log level to check.
   * @param {Severity | Name} threshold - The threshold to compare against.
   * @returns {boolean} 0 if the log level meets the threshold, +1 if the log level exceeds the
   * threshold, and -1 otherwise.
   * @deprecated Use compareLevels
   */
  compareLevels(level: LogLevel.Spec, threshold: LogLevel.Spec): CompareResult;

  /**
   * Calculates the maximum character width of all log level names up to a given
   * threshold, for formatting purposes.
   *
   * @param {Def | Severity | Name} threshold - The highest log level to consider.
   * @returns {Integer} The maximum width of the level names.
   */
  maxWidth(threshold: LogLevel.Spec): Integer;

  /**
   * Applies a level-specific color formatting function to a message.
   *
   * @param {string} msg - The message to format.
   * @param {Name} level - The log level of the message.
   * @returns {string} The formatted (potentially colored) message.
   */
  // applyColors(msg: string, level: LogLevel.Spec): string;
}
