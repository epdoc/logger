/**
 * @file Context type definitions
 * @description Type interfaces for CLI application contexts, providing the foundation
 * for both traditional and BaseContext patterns.
 * @module
 */

import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import type { DenoPkg } from '../types.ts';

/**
 * Base context interface for CLI applications
 *
 * Defines the minimal contract that all CLI contexts must implement.
 * Provides logging capabilities, package metadata, operational flags,
 * and lifecycle management.
 *
 * @template M - Message builder type extending Console.Builder
 * @template L - Logger type extending Log.IEmitter
 *
 * @example
 * ```typescript
 * // Traditional implementation
 * class MyContext implements IBase<MyBuilder, MyLogger> {
 *   log: MyLogger;
 *   logMgr: Log.Mgr<MyBuilder>;
 *   dryRun = false;
 *   pkg: DenoPkg;
 *
 *   constructor(pkg: DenoPkg) {
 *     this.pkg = pkg;
 *     // Setup logging...
 *   }
 *
 *   async close() {
 *     await this.logMgr.close();
 *   }
 * }
 *
 * // BaseContext implementation (recommended)
 * class AppContext extends BaseContext<MyBuilder, MyLogger> {
 *   constructor() {
 *     super(pkg);
 *     this.setupLogging();
 *   }
 *
 *   setupLogging() {
 *     this.logMgr = Log.createLogManager(MyBuilder, { threshold: 'info' });
 *     this.log = this.logMgr.getLogger<MyLogger>();
 *   }
 * }
 * ```
 */
export interface IBase<
  M extends Console.Builder = Console.Builder,
  L extends Log.IEmitter = Log.Std.Logger<M>,
> {
  /** Logger instance for application output */
  log: L;
  /** Log manager for configuration and lifecycle */
  logMgr: Log.Mgr<M>;
  /** Flag indicating dry-run mode (no actual changes) */
  dryRun: boolean;
  /** Package metadata from deno.json */
  pkg: DenoPkg;
  /** Cleanup method called when application exits */
  close(): Promise<void>;
}
