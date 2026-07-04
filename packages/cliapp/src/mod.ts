/**
 * @file Main module exports for @epdoc/cliapp
 * @description Type-safe CLI framework supporting commander.js-based command hierarchies,
 * with integrated logging, context flow, and MCP server support. This is the main entry
 * point for building CLI applications using the cliapp framework.
 * @module
 */

export * from './base.ts';
export * as Cmd from './cmd/mod.ts';
export * as Ctx from './context.ts';
export * as Mcp from './mcp/mod.ts';
export { FluentOptionBuilder } from './option.ts';
export * from './pkg-type.ts';
export * as Progress from './progress/mod.ts';
export { run } from './run.ts';
export * from './types.ts';
export * from './utils.ts';

// Re-export Commander.js for convenience
export * as Commander from 'commander';
