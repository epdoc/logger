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
 * Extracts the MsgBuilder type from a Logger type.
 * This allows us to use single-generic patterns where the MsgBuilder type
 * is automatically inferred from the Logger.
 *
 * @template L - Logger type extending Log.IEmitter
 * @returns The MsgBuilder type used by the logger, or Console.Builder as fallback
 */
export type ExtractMsgBuilder<L> = L extends Log.Std.Logger<infer M> ? M : Console.Builder;

/**
 * Base context interface for CLI applications
 *
 * Defines the minimal contract that all CLI contexts must implement.
 * Provides logging capabilities, package metadata, operational flags,
 * and lifecycle management.
 *
 * @template L - Logger type extending Log.IEmitter (MsgBuilder type is inferred)
 *
 * @example
 * ```typescript
 * class AppBuilder extends Console.Builder {
 *   fileOp(path: string) { return this.text(path); }
 * }
 * type Logger = Log.Std.Logger<AppBuilder>;
 *
 * // Simple single-generic pattern
 * class AppContext extends BaseContext<Logger> {
 *   constructor() {
 *     super(pkg);
 *     this.setupLogging();
 *   }
 *
 *   setupLogging() {
 *     this.logMgr = new Log.Mgr<AppBuilder>();
 *     this.logMgr.msgBuilderFactory = AppBuilder.createMsgBuilder;
 *     this.logMgr.initLevels(Log.Std.factoryMethods);
 *     this.logMgr.threshold = 'info';
 *     this.log = await this.logMgr.getLogger<Logger>();
 *   }
 * }
 * ```
 */
export interface IBase<L extends Log.IEmitter = Log.Std.Logger<Console.Builder>> {
  /** Logger instance for application output */
  log: L;
  /** Log manager for configuration and lifecycle */
  logMgr: Log.Mgr<ExtractMsgBuilder<L>>;
  /** Flag indicating dry-run mode (no actual changes) */
  dryRun: boolean;
  /** Package metadata from deno.json */
  pkg: DenoPkg;
  /** Cleanup method called when application exits */
  close(): Promise<void>;
}
