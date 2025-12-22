/**
 * @file Logger manager helper
 * @description Simplifies logger manager setup with custom builders
 * @module
 */

import type { Console } from '@epdoc/msgbuilder';
import type { IEmitter } from '@epdoc/msgbuilder';
import { Mgr } from './logmgr.ts';

/**
 * Options for creating a log manager
 */
export interface LogManagerOptions {
  threshold?: 'spam' | 'trace' | 'debug' | 'info' | 'warn' | 'error';
  showLevel?: boolean;
  showTimestamp?: 'elapsed' | 'time' | boolean;
  showData?: boolean;
}

/**
 * Creates a log manager with an optional custom builder class.
 * Handles the complex factory setup internally.
 * 
 * @param BuilderClass - Optional custom builder class (defaults to Console.Builder)
 * @param options - Configuration options for the logger
 * @returns Configured log manager ready to use
 * 
 * @example
 * ```typescript
 * // With custom builder
 * const MyBuilder = extendBuilder({ ... });
 * const logMgr = createLogManager(MyBuilder, { threshold: 'info' });
 * 
 * // With standard builder
 * const logMgr = createLogManager(undefined, { threshold: 'debug' });
 * ```
 */
export function createLogManager<T extends Console.Builder>(
  BuilderClass?: new (emitter: IEmitter) => T,
  options: LogManagerOptions = {}
): Mgr<T> {
  const mgr = new Mgr<T>();
  
  // Set up custom builder factory if provided
  if (BuilderClass) {
    mgr.msgBuilderFactory = (emitter: IEmitter) => new BuilderClass(emitter);
  }
  
  // Initialize and configure
  mgr.init();
  
  // Apply options
  if (options.threshold) {
    mgr.threshold = options.threshold;
  }
  
  if (options.showLevel !== undefined) {
    mgr.show.level = options.showLevel;
  }
  
  if (options.showTimestamp !== undefined) {
    mgr.show.timestamp = options.showTimestamp;
  }
  
  if (options.showData !== undefined) {
    mgr.show.data = options.showData;
  }
  
  return mgr;
}
