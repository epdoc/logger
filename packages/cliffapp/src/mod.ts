/**
 * A standard bridge between @epdoc/logger and deno-cliffy.
 *
 * This module provides a standardized way to add logging options to Cliffy applications,
 * automatically configure the logger based on those options, and wrap the application
 * lifecycle with logging and error handling.
 *
 * @module
 */

export * from './command.ts';
export * from './logging.ts';
export * from './types.ts';
