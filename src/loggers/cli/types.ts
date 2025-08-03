import type * as MsgBuilder from '../../message/mod.ts';

/**
 * Defines the interface for a CLI logger, exposing message builders for each
 * CLI-specific log level.
 *
 * @template M - The type of message builder used by the logger.
 */
export interface ICliLogger<M extends MsgBuilder.Base.Builder> {
  /** Message builder for the `ERROR` log level. */
  error: M;
  /** Message builder for the `WARN` log level. */
  warn: M;
  /** Message builder for the `HELP` log level. */
  help: M;
  /** Message builder for the `DATA` log level. */
  data: M;
  /** Message builder for the `INFO` log level. */
  info: M;
  /** Message builder for the `DEBUG` log level. */
  debug: M;
  /** Message builder for the `PROMPT` log level. */
  prompt: M;
  /** Message builder for the `VERBOSE` log level. */
  verbose: M;
  /** Message builder for the `INPUT` log level. */
  input: M;
  /** Message builder for the `SILLY` log level. */
  silly: M;
}
