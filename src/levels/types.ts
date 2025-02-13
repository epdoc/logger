/**
 * @fileoverview This module defines types and interfaces for log levels used in the logging library.
 * It provides a structure for custom log levels and their associated methods.
 */

import type { IBasic } from './ibasic.ts';

/**
 * Represents the name of a log level.
 */
export type Name = string;

/**
 * Represents the numeric value of a log level.
 */
export type Value = number;

/**
 * Function type for formatting log messages.
 * @param {string} msg - The message to format.
 * @returns {string} The formatted message.
 */
export type FormatFn = (msg: string) => string;

/**
 * Represents the definition of an individual log level that can be used with
 * the {@linkcode LogLevels} class.
 */
export type LogLevelDef = {
  val: number;
  fmtFn?: FormatFn;
  default?: boolean;
  flush?: boolean;
};

/**
 * Type representing a dictionary with multiple log level definitions. The
 * dictionary keys are the names of the log levels (eg. info, debug). All log
 * levels are internally resolved to uppercase names.
 */
export type LogLevelsDef = Record<string, LogLevelDef>;

export type FactoryMethod = () => IBasic;
