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

import type { StyleFormatterFn } from '$msgbuilder';
import type { Integer } from '@epdoc/type';
import type { IBasic } from './ibasic.ts';

/**
 * Represents the unique name of a log level, such as 'INFO' or 'DEBUG'.
 */
export type Name = string;

/**
 * Represents the numeric value associated with a log level.
 */
export type Value = Integer;

/**
 * Defines the complete configuration for a single log level.
 */
export type LogLevelDef = {
  /**
   * The numeric value of the log level. This determines its priority.
   */
  val: Value;
  /**
   * An optional function to apply custom styling or formatting to messages
   * logged at this level. Typically used for adding colors.
   *
   * @param {string} msg - The message to format.
   * @returns {string} The formatted message.
   */
  fmtFn?: StyleFormatterFn;
  /**
   * If `true`, this level is considered the default logging threshold if no
   * other level is specified.
   * @default false
   */
  default?: boolean;
  /**
   * If `true`, this level is considered the lowest-priority level, often used
   * for verbose or debugging messages.
   * @default false
   */
  lowest?: boolean;
  /**
   * If `true`, this level is designated as the primary "warning" level.
   * @default false
   */
  warn?: boolean;
  /**
   * If `true`, any message logged at this level will trigger an immediate
   * flush of the transport buffer. Useful for critical errors.
   * @default false
   */
  flush?: boolean;
  /** An icon that can be displayed in place of the log level string. */
  icon?: string;
};

/**
 * Defines a complete set of log levels for a logger instance.
 *
 * @remarks
 * The keys are the log level {@link Name|names} (e.g., 'ERROR'), and the values
 * are their corresponding {@link LogLevelDef|definitions}.
 */
export type LogLevelsDef = Record<Name, LogLevelDef>;

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
