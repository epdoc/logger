/**
 * Main entry point for the @epdoc/cliapp module.
 *
 * @module
 */
export { Command } from './src/command.ts';
export { run } from './src/run.ts';
export type * from './src/types.ts';
export { commaList, configureLogging } from './src/utils.ts';
// Re-export commander itself for convenience
export * as Commander from 'commander';
