import type { LogMgr } from '../logmgr.ts';
import type * as MsgBuilder from '../message/mod.ts';
import type * as Base from './base/mod.ts';

/**
 * Defines the factory function signature for creating logger instances.
 *
 * @template M - The type of message builder used by the logger.
 * @param {LogMgr<M> | IEmitter} logMgr - The log manager or a parent emitter.
 * @param {IGetChildParams} [opts] - Optional parameters for child logger creation.
 * @returns {IEmitter} A new logger instance.
 */
export type FactoryMethod<M extends MsgBuilder.Base.IBuilder, L extends Base.IEmitter> = (
  logMgr: LogMgr<M> | Base.IEmitter,
  opts?: Base.IGetChildParams,
) => L;
