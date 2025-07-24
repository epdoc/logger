/**
 * Provides a central aggregation point for different log level implementations.
 *
 * @remarks
 * This module re-exports the `cli` and `std` log level configurations, as well
 * as the core `Level` types and classes. It simplifies access to various log
 * level definitions and their associated factory methods.
 *
 * @module
 */
export * as cli from './cli/index.ts';
export * as std from './std/index.ts';
export * as Level from './level.ts';
