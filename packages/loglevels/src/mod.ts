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
 * import { LogLevels, type LogLevelsSet } from '@epdoc/loglevels';
 *
 * const myLevels: LogLevelsSet = {
 *   id: 'my-app',
 *   levels: {
 *     ERROR: { severity: 17 },
 *     INFO:  { severity: 9 },
 *     DEBUG: { severity: 5 },
 *   },
 * };
 *
 * const levels = new LogLevels(myLevels);
 * console.log(levels.defaultLevel.name); // 'INFO'
 * console.log(levels.asSpec('ERROR')!.severity); // 17
 * ```
 */

export * from './base.ts';
export * from './guards.ts';
export * from './ibasic.ts';
export * from './types.ts';
export * from './utils.ts';
