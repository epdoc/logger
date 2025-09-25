/**
 * @fileoverview Java-style logger implementation for @epdoc/logger ecosystem
 *
 * @remarks
 * This package provides Java-style logging capabilities with standard Java log levels:
 * SEVERE, WARNING, INFO, CONFIG, FINE, FINER, FINEST
 *
 * @example Basic usage
 * ```ts
 * import { Log } from '@epdoc/logger';
 * import { Java } from '@epdoc/logjava';
 *
 * const logMgr = new Log.Mgr();
 * logMgr.loggerFactory = Java.factoryMethods;
 *
 * const logger = logMgr.getLogger<Java.Logger>();
 * logger.severe.h1('Critical error').emit();
 * logger.info.text('Application started').emit();
 * ```
 *
 * @module
 */

export { javaFactoryMethods as factoryMethods } from './consts.ts';
export { JavaLogger as Logger } from './logger.ts';
