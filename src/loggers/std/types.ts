import type * as MsgBuilder from '../../message/mod.ts';

/**
 * Defines the interface for a standard logger, exposing message builders for
 * each standard log level.
 *
 * @template M - The type of message builder used by the logger.
 */
export interface IStdLogger<M extends MsgBuilder.Base.Builder> {
  /** Message builder for the `ERROR` log level. */
  error: M;
  /** Message builder for the `WARN` log level. */
  warn: M;
  /** Message builder for the `INFO` log level. */
  info: M;
  /** Message builder for the `VERBOSE` log level. */
  verbose: M;
  /** Message builder for the `DEBUG` log level. */
  debug: M;
  /** Message builder for the `TRACE` log level. */
  trace: M;
  /** Message builder for the `SPAM` log level. */
  spam: M;
}
