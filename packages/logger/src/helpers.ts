/**
 * @file Logger manager helper
 * @description Simplifies logger manager setup with custom builders
 * @module
 */

import type { Console, IEmitter } from '@epdoc/msgbuilder';
import { _ } from '@epdoc/type';
import { LogMgr } from './logmgr.ts';

/**
 * Options for creating a log manager
 * @experimental This API is experimental and may change in future versions.
 */
export interface LogManagerOptions {
  threshold?: 'spam' | 'trace' | 'debug' | 'info' | 'warn' | 'error';
  showLevel?: boolean;
  showTimestamp?: 'elapsed' | 'local' | 'utc' | boolean;
  showData?: boolean;
  color?: boolean;
}

/**
 * Creates a log manager with an optional custom builder class.
 * Handles the complex factory setup internally.
 *
 * @experimental This API is experimental and may change in future versions.
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
  options: LogManagerOptions = {},
): LogMgr<T> {
  const mgr = new LogMgr<T>();

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

  if (_.isBoolean(options.showLevel)) {
    mgr.show.level = options.showLevel;
  }

  if (options.showTimestamp !== undefined) {
    if (_.isBoolean(options.showTimestamp)) {
      mgr.show.timestamp = options.showTimestamp ? 'local' : undefined;
    } else {
      mgr.show.timestamp = options.showTimestamp;
    }
  }

  if (_.isBoolean(options.showData)) {
    mgr.show.data = options.showData;
  }

  if (_.isBoolean(options.color)) {
    mgr.show.color = options.color;
  }

  return mgr;
}
