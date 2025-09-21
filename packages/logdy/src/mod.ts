/**
 * @fileoverview Logdy transport for @epdoc/logger ecosystem
 * 
 * @remarks
 * This package provides a transport for streaming logs to Logdy web interface
 * via HTTP API. It supports batching, retries, and structured logging.
 * 
 * @example Basic usage
 * ```ts
 * import { Log } from '@epdoc/logger';
 * import { LogdyTransport } from '@epdoc/logdy';
 * 
 * const logMgr = new Log.Mgr();
 * const transport = new LogdyTransport(logMgr, {
 *   url: 'http://localhost:8080/api/v1/logs'
 * });
 * 
 * logMgr.addTransport(transport);
 * 
 * const logger = logMgr.getLogger();
 * logger.info.h1('Hello Logdy!').emit();
 * ```
 * 
 * @module
 */

export { LogdyTransport } from './transport.ts';
export type { LogdyTransportOptions } from './transport.ts';
