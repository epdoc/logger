/**
 * Aggregates and re-exports all components related to the standard logger.
 *
 * @remarks
 * This module provides a convenient entry point for accessing the `StdLogger`
 * class, its associated factory method (`getLogger`), and all relevant type
 * definitions for standard logging.
 *
 * @module
 */
export { getLogger, StdLogger as Logger } from './logger.ts';
export * from './types.ts';
