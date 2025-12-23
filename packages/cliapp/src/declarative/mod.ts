/**
 * @file Declarative API module exports
 * @description Modern declarative API for building CLI applications with minimal boilerplate.
 * Provides factory functions, option types, and command builders using the separate
 * declaration pattern for maximum type safety and flexibility.
 * @module
 */

// Command builders
export { DeclarativeCommand as Command } from './command.ts';
export { DeclarativeRootCommand as RootCommand } from './root-command.ts';

// Factory functions (recommended entry points)
export * from './helpers.ts';

// Option types and builders
export { option } from './consts.ts';
export * as Option from './option/mod.ts';

// Type definitions for separate declaration pattern
export type { ArgumentDefinition, CommandDefinition, RootCommandDefinition } from './types.ts';
