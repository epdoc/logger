/**
 * @module
 * The main entry point for the `@epdoc/loglevels` module.
 *
 * @remarks
 * This module exports all the public-facing APIs for creating and managing
 * custom log level systems. It re-exports the core classes, interfaces, and
 * types from the other modules in this package.
 *
 * @example
 * ```ts
 * import { LogLevels, type LogLevelsDef } from '@epdoc/loglevels';
 *
 * const myLevels: LogLevelsDef = {
 *   ERROR: { val: 0 },
 *   INFO: { val: 1, default: true },
 *   DEBUG: { val: 2 }
 * };
 *
 * const levelManager = new LogLevels(myLevels);
 * console.log(levelManager.names); // ['ERROR', 'INFO', 'DEBUG']
 * console.log(levelManager.defaultLevelName); // 'INFO'
 * ```
 */

export * from './base.ts';
export * from './helpers.ts';
export * from './ibasic.ts';
export * from './types.ts';
