/**
 * @fileoverview This module defines types and interfaces for log levels used in the logging library.
 * It provides a structure for custom log levels and their associated methods.
 */

import type { StyleFormatterFn } from '$msgbuilder';
import type { Integer } from '@epdoc/type';
import type { IBasic } from './ibasic.ts';

/**
 * Defines the name of a log level (e.g., 'info', 'debug').
 */
export type Name = string;

/**
 * Defines the numeric value associated with a log level.
 */
export type Value = Integer;

/**
 * Represents the definition of a single log level.
 */
export type LogLevelDef = {
  /** The numeric value of the log level. */
  val: Value;
  /** An optional formatting function for messages at this level. */
  fmtFn?: StyleFormatterFn;
  /** Indicates if this is the default log level. */
  default?: boolean;
  /** Indicates if this is the lowest log level. */
  lowest?: boolean;
  /** Indicates if this is the warning (warn) log level. */
  warn?: boolean;
  /** Indicates if messages at this level should trigger an immediate flush. */
  flush?: boolean;
};

/**
 * Defines the structure for a collection of log level definitions.
 * The keys are log level names (strings), and the values are {@link LogLevelDef} objects.
 */
export type LogLevelsDef = Record<Name, LogLevelDef>;

/**
 * Defines the factory function signature for creating log level instances.
 *
 * @remarks
 * This pattern allows for different implementations of log level management
 * (e.g., standard, CLI-specific) to be easily swapped.
 *
 * @returns {IBasic} An instance of a class implementing the {@link IBasic} interface.
 */
export type FactoryMethod = () => IBasic;

export type { IBasic };
