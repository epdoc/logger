import type * as Levels from '@epdoc/loglevels';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import type { LogMgr } from '../logmgr.ts';
import type { IGetChildParams } from '../types.ts';
import type * as Logger from './interfaces.ts';

/**
 * Defines the factory function signature for creating logger instances.
 *
 * @template M - The type of message builder used by the logger.
 * @param {LogMgr<M> | Logger.ILoggerEmitter} logMgr - The log manager or a parent emitter.
 * @param {Logger.IGetChildParams} [opts] - Optional parameters for child logger creation.
 * @returns {Logger.ILoggerEmitter} A new logger instance.
 */
export type FactoryMethod<M extends MsgBuilder.Abstract, L extends Logger.ILoggerEmitter> = (
  logMgr: LogMgr<M> | Logger.ILoggerEmitter,
  opts?: IGetChildParams,
) => L;

export interface IFactoryMethods<M extends MsgBuilder.Abstract, L extends Logger.ILoggerEmitter> {
  createLogger: FactoryMethod<M, L>;
  createLevels: Levels.FactoryMethod;
  logLevelNames: () => string[];
}
