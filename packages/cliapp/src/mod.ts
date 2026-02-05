/**
 * @file Main module exports for @epdoc/cliapp v2.0
 * @description Clean CLI framework with automatic context flow and declarative configuration
 * @module
 */

// Core functionality
export { BaseCommand } from './cmd-abstract.ts';
export { createCommand } from './cmd-factory.ts';
export { Context, type ICtx } from './context.ts';
export { FluentOptionBuilder } from './option.ts';

// Application lifecycle management
export { run } from './run.ts';

// Type definitions
export * from './types.ts';

// Utility functions
export { commaList, configureLogging } from './utils.ts';

// Re-export Commander.js for convenience
export * as Commander from 'commander';

export * as Ctx from './context.ts';
