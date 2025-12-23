/**
 * @file Main module exports for @epdoc/cliapp
 * @description Entry point for the CLI application framework, providing both traditional
 * imperative API and modern declarative API for building command-line applications.
 * @module
 */

// Core command and context functionality
export { Command } from './command.ts';
export * as Ctx from './context/mod.ts';

// Modern declarative API (recommended)
export * as Declarative from './declarative/mod.ts';

// Application lifecycle management
export { run } from './run.ts';

// Type definitions
export * from './types.ts';

// Utility functions
export { commaList, configureLogging } from './utils.ts';

// Re-export Commander.js for convenience and custom options
export * as Commander from 'commander';
