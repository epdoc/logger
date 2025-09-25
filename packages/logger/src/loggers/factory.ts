import type * as Levels from '$level';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import type { LogMgr } from '../logmgr.ts';
import type * as Logger from './types.ts';

/**
 * Defines the factory function signature for creating logger instances.
 *
 * @template M - The type of message builder used by the logger.
 * @param {LogMgr<M> | Logger.IEmitter} logMgr - The log manager or a parent emitter.
 * @param {Logger.IGetChildParams} [opts] - Optional parameters for child logger creation.
 * @returns {Logger.IEmitter} A new logger instance.
 */
export type FactoryMethod<M extends MsgBuilder.Abstract, L extends Logger.IEmitter> = (
  logMgr: LogMgr<M> | Logger.IEmitter,
  opts?: Logger.IGetChildParams,
) => L;

export interface IFactoryMethods<M extends MsgBuilder.Abstract, L extends Logger.IEmitter> {
  createLogger: FactoryMethod<M, L>;
  createLevels: Levels.FactoryMethod;
  logLevelNames: () => string[];
}
