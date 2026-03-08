import type { Integer } from '@epdoc/type';
import type * as LogLevel from './types.ts';

/**
 * Defines the core contract for a log level management system.
 *
 * @remarks
 * This interface specifies the essential methods and properties required to
 * handle a collection of log levels. Any class that implements `IBasic` can be
 * used by the `LogMgr` to manage level lookups, threshold checks, and
 * formatting.
 *
 * This allows for different sets of log levels (e.g., a simple set for standard
 * logging, a more verbose set for CLI tools) to be used interchangeably.
 */
export interface IBasic {
  readonly $$id: string;

  /** Returns the Spec for the default level (severity 9, typically INFO). */
  get defaultLevel(): LogLevel.Spec;
  /** Returns the Spec for the warn level (severity 13). */
  get warnLevel(): LogLevel.Spec;
  /** Returns the Spec for the flush level (severity 17, typically ERROR). */
  get flushLevel(): LogLevel.Spec;

  /** Map of level names to their full Spec objects. */
  get specMap(): LogLevel.SpecMap;
  /** Array indexed by severity number (1–24), with Spec or null at each index. */
  get specArray(): LogLevel.SpecArray;

  /**
   * Converts a level name, severity number, or Spec to a full Spec object.
   * Returns `null` if the level is not found.
   *
   * @param level - A level name, severity number, or existing Spec.
   * @returns The matching Spec, or `null`.
   */
  asSpec(level: LogLevel.Spec | LogLevel.Name | LogLevel.Severity): LogLevel.Spec | null;

  /**
   * Calculates the maximum character width of all log level names at or above
   * the given threshold severity, for column-alignment in formatted output.
   *
   * @param threshold - Only levels with severity >= this spec's severity are considered.
   * @returns The maximum name width among qualifying levels.
   */
  maxWidth(threshold: LogLevel.Spec): Integer;
}
