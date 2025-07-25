import { Indent as LoggerIndent } from '../../logger/indent.ts';
import type * as Logger from '../../logger/types.ts';
import { LogMgr } from '../../logmgr.ts';
import type { IBasic as MsgBuilderIBasic } from '../../message/types.ts';
import type * as cli from './types.ts';

/**
 * Factory method to obtain a CLI logger instance.
 *
 * @remarks
 * This function provides a flexible way to get a `CliLogger`. It can either
 * create a new root logger if a `LogMgr` is provided, or return a child logger
 * if an existing `CliLogger` instance is passed.
 *
 * @example
 * const logMgr = new Log.Mgr(Log.cli.createLogLevels);
 * logMgr.loggerFactory = Log.cli.createLogger;
 * const logger = logMgr.getLogger<Log.cli.Logger<Log.MsgBuilder.Console>>();
 * logger.info.text('Hello').emit();
 *
 * @template M - The type of message builder used by the logger.
 * @param {LogMgr<M> | Logger.IEmitter} log - The log manager or an existing logger instance.
 * @param {Logger.IGetChildParams} [params] - Optional parameters for creating a child logger.
 * @returns {CliLogger<M>} A new or child `CliLogger` instance.
 * @throws {Error} If an invalid logger type is provided.
 */
export const createCliLogger = <M extends MsgBuilderIBasic>(
  log: LogMgr<M> | Logger.IEmitter,
  params?: Logger.IGetChildParams,
): CliLogger<M> => {
  if (log instanceof LogMgr) {
    return new CliLogger<M>(log, params);
  } else if (log instanceof CliLogger) {
    return log.getChild(params) as CliLogger<M>;
  }
  throw new Error('Invalid logger type');
};

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
export class CliLogger<M extends MsgBuilderIBasic> extends LoggerIndent<M>
  implements cli.ICliLogger<M>, Logger.IEmitter {
  constructor(logMgr: LogMgr<M>, params?: Logger.IGetChildParams) {
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
   * Provides a message builder for the `ERROR` log level.
   *
   * @remarks
   * Use this level for critical errors that indicate a failure in the CLI
   * application, often requiring user intervention or indicating a bug.
   *
   * @returns {M} A message builder configured for the `ERROR` level.
   */
  public get error(): M {
    return this._logMgr.getMsgBuilder('ERROR', this);
  }

  /**
   * Provides a message builder for the `WARN` log level.
   *
   * @remarks
   * Use this level for potential issues or non-critical problems that the user
   * should be aware of, but which do not prevent the application from continuing.
   *
   * @returns {M} A message builder configured for the `WARN` level.
   */
  public get warn(): M {
    return this._logMgr.getMsgBuilder('WARN', this);
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
    return this._logMgr.getMsgBuilder('HELP', this);
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
    return this._logMgr.getMsgBuilder('DATA', this);
  }

  /**
   * Provides a message builder for the `INFO` log level.
   *
   * @remarks
   * Use this level for general informational messages that provide high-level
   * feedback on the application's progress or state.
   *
   * @returns {M} A message builder configured for the `INFO` level.
   */
  public get info(): M {
    return this._logMgr.getMsgBuilder('INFO', this);
  }

  /**
   * Provides a message builder for the `DEBUG` log level.
   *
   * @remarks
   * Use this level for detailed diagnostic information, typically intended
   * for developers during debugging. This might include internal states or
   * execution paths.
   *
   * @returns {M} A message builder configured for the `DEBUG` level.
   */
  public get debug(): M {
    return this._logMgr.getMsgBuilder('DEBUG', this);
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
    return this._logMgr.getMsgBuilder('PROMPT', this);
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
    return this._logMgr.getMsgBuilder('VERBOSE', this);
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
    return this._logMgr.getMsgBuilder('INPUT', this);
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
    return this._logMgr.getMsgBuilder('SILLY', this);
  }
}
