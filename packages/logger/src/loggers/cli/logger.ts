import type * as MsgBuilder from '@epdoc/msgbuilder';
import type { LogMgr } from '../../logmgr.ts';
import type * as Base from '../base/mod.ts';
import * as Min from '../min/mod.ts';

/**
 * Implements a logger with a comprehensive set of log levels tailored for CLI applications.
 *
 * @remarks
 * This logger provides a rich set of levels designed for command-line interfaces,
 * allowing for fine-grained control over output verbosity and user interaction.
 * The levels include:
 * - `error`: Critical errors.
 * - `warn`: Potential issues.
 * - `help`: Usage instructions or helpful tips.
 * - `data`: Structured data output.
 * - `info`: General informational messages.
 * - `debug`: Detailed debugging information.
 * - `prompt`: Messages requiring user input.
 * - `verbose`: More detailed information than `info`.
 * - `input`: User input received by the application.
 * - `silly`: Extremely verbose, often temporary, debugging output.
 *
 * This class extends {@link Logger.Indent} to provide indentation capabilities
 * and implements {@link cli.ICliLogger} and {@link Logger.IEmitter} for its core
 * logging functionality.
 *
 * @template M - The type of message builder used by the logger.
 */
export class CliLogger<M extends MsgBuilder.Abstract> extends Min.Logger<M> {
  constructor(logMgr: LogMgr<M>, params?: Base.IGetChildParams) {
    super(logMgr, params);
  }

  /**
   * Creates a shallow copy of the current `CliLogger` instance.
   * @returns {this} A new `CliLogger` instance with copied properties.
   * @internal
   */
  override copy(): this {
    const result = new (this.constructor as new (logMgr: LogMgr<M>) => this)(this._logMgr);
    result.assign(this);
    return result;
  }

  /**
   * Provides a message builder for the `HELP` log level.
   *
   * @remarks
   * Use this level to display usage instructions, command syntax, or helpful
   * tips to the user.
   *
   * @returns {M} A message builder configured for the `HELP` level.
   */
  public get help(): M {
    return this.getIndentedMsgBuilder('HELP');
  }

  /**
   * Provides a message builder for the `DATA` log level.
   *
   * @remarks
   * Use this level to output structured data, such as JSON objects or tables,
   * that are meant to be consumed programmatically or are part of a report.
   *
   * @returns {M} A message builder configured for the `DATA` level.
   */
  public get data(): M {
    return this.getIndentedMsgBuilder('DATA');
  }

  /**
   * Provides a message builder for the `PROMPT` log level.
   *
   * @remarks
   * Use this level to display messages that prompt the user for input or a
   * decision.
   *
   * @returns {M} A message builder configured for the `PROMPT` level.
   */
  public get prompt(): M {
    return this.getIndentedMsgBuilder('PROMPT');
  }

  /**
   * Provides a message builder for the `VERBOSE` log level.
   *
   * @remarks
   * Use this level for more detailed informational messages than `INFO`,
   * often useful for understanding the steps within a complex CLI operation.
   *
   * @returns {M} A message builder configured for the `VERBOSE` level.
   */
  public get verbose(): M {
    return this.getIndentedMsgBuilder('VERBOSE');
  }

  /**
   * Provides a message builder for the `INPUT` log level.
   *
   * @remarks
   * Use this level to log the actual input received from the user, useful for
   * debugging interactive CLI applications.
   *
   * @returns {M} A message builder configured for the `INPUT` level.
   */
  public get input(): M {
    return this.getIndentedMsgBuilder('INPUT');
  }

  /**
   * Provides a message builder for the `SILLY` log level.
   *
   * @remarks
   * This is an extremely verbose level, typically used for very noisy or
   * temporary debugging output that would be removed before production.
   *
   * @returns {M} A message builder configured for the `SILLY` level.
   */
  public get silly(): M {
    return this.getIndentedMsgBuilder('SILLY');
  }
}
