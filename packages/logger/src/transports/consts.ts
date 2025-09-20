import type * as Level from '$level';
import type * as Logger from '$logger';
import type * as MsgBuilder from '$msgbuilder';

/**
 * Defines the available output formats for transports.
 */
export const OutputFormat = {
  /** Plain text format. */
  TEXT: 'text',
  /** Single-line JSON object format. */
  JSON: 'json',
  /** A format where each log entry is an element in a JSON array. */
  JSON_ARRAY: 'jsonArray',
} as const;

/**
 * Defines the factory function signature for creating transport instances.
 *
 * @template M - The type of message builder used by the logger.
 * @param {LogMgr<M>} logMgr - The log manager instance.
 * @returns {AbstractMsgBuilder<M>} A new transport instance.
 */
export interface IStaticMsgBuilder {
  create(level: Level.Name, emitter: Logger.Base.IEmitter): MsgBuilder.Base.Builder;
}
