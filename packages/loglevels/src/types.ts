/**
 * @module
 * This module defines the core types and interfaces for creating and managing
 * custom log level systems.
 *
 * @example
 * ```ts
 * import type { LogLevelsDef, StyleFormatterFn } from '@epdoc/loglevels';
 * import { bold, red } from '@std/fmt/colors';
 *
 * const myCustomLevels: LogLevelsDef = {
 *   FATAL: { val: 0, fmtFn: (str) => bold(red(str)), flush: true },
 *   ERROR: { val: 1, fmtFn: red },
 *   INFO: { val: 2, default: true },
 *   DEBUG: { val: 3, lowest: true }
 * };
 * ```
 */

import type { Integer } from '@epdoc/type';
import type { IBasic } from './ibasic.ts';

/**
 * Represents the unique case-insensitive name of a log level, such as, 'info', 'INFO' or 'DEBUG'.
 */
export type Name = string;

/**
 * Represents the OTLP numeric value associated with a log level.
 * This is an integer between 1 and 24.
 * @see isSeverityNumber
 */
export type Severity = Integer;

/**
 * Defines the complete configuration for a single log level.
 */
export type LogLevelsSpec = {
  /** OTLP severityNumber mapping. */
  severity: Severity;
  /**
   * An optional function to apply custom styling or formatting to messages
   * logged at this level. Typically used for adding colors.
   *
   * @param {string} msg - The message to format.
   * @returns {string} The formatted message.
   */
  fmtFn?: (str: string) => string;
  /** An icon that can be displayed in place of the log level string. */
  icon?: string;
};

export type Spec = LogLevelsSpec & {
  name: Name;
};

/**
 * Defines a complete set of log levels for a logger instance.
 *
 * @remarks
 * The keys in levels are the log level {@link Name|names} (e.g., 'ERROR'), and the values are their
 * corresponding {@link LogLevelsSpec|definitions}.
 */
export type LogLevelsSet = {
  id: string;
  levels: LogLevelMap;
};
export type LogLevelMap = Record<Name, LogLevelsSpec>;

export type SpecMap = Map<Name, Spec>;
export type SpecArray = (Spec | null)[];

/**
 * Defines the signature for a factory function that creates a log level
 * management instance.
 *
 * @remarks
 * This factory pattern allows for different log level implementations (e.g.,
 * standard, CLI-specific) to be used interchangeably by the logger.
 *
 * @returns {IBasic} An instance of a class that implements the {@link IBasic}
 *   interface for managing log levels.
 */
export type FactoryMethod = () => IBasic;

export type { IBasic };
