/**
 * @file Main module exports for @epdoc/cliapp v2.0
 * @description Clean CLI framework with automatic context flow and declarative configuration
 * @module
 */

export * from './base.ts';
export * as Cmd from './cmd/mod.ts';
export * as Ctx from './context.ts';
export { FluentOptionBuilder } from './option.ts';
export * from './pkg-type.ts';
export { run } from './run.ts';
export * from './types.ts';
export * from './utils.ts';

// Re-export Commander.js for convenience
export * as Commander from 'commander';
