import * as _ from '@epdoc/type';
import * as colors from '@std/fmt/colors';
import * as Commander from 'commander';
import { config } from './config.ts';
import type { DenoPkg, ICtx, Logger, MsgBuilder, Opts } from './types.ts';
import { commaList } from './utils.ts';

/**
 * Represents a CLI command, extending `Commander.Command` to add custom functionality.
 * This class integrates logging, context management, and standardized options for building CLI applications.
 */
export class Command<M extends MsgBuilder = MsgBuilder, L extends Logger<M> = Logger<M>> extends Commander.Command {
  pkg: DenoPkg;

  /**
   * Creates an instance of Command.
   * @param {Ctx.ICtx} ctx - The context object, which includes package metadata used to set the command name.
   */
  constructor(pkg: DenoPkg) {
    super(pkg.name);
    this.pkg = pkg;
  }

  /**
   * Initializes the command with basic options, descriptions, and help/output configurations.
   * It sets the version and description from the context's package metadata.
   *
   * @param {Ctx.ICtx} ctx - The context object containing package metadata.
   * @returns {this} The current instance of the command, allowing for method chaining.
   */
  init(_ctx: ICtx<M, L>): this {
    if (this.pkg.version) {
      this.version(this.pkg.version, '-v, --version', 'Output the current version.');
    }
    if (this.pkg.description) {
      this.description(this.pkg.description);
    }
    this.configureHelp(config.help).configureOutput(config.output);
    return this;
  }

  /**
   * Adds a standard set of logging-related options to the command.
   * These options allow users to control log levels, verbosity, and the format of log output.
   *
   * @param {Ctx.ICtx} ctx - The context object, used to access logger configurations.
   * @returns {this} The current instance of the command, allowing for method chaining.
   */
  addLogging(ctx: ICtx<M, L>): this {
    const options: Commander.Option[] = [
      new Commander.Option('--log <level>', 'Set the threshold log output level.')
        .choices(ctx.logMgr.logLevels.names)
        .argParser((val) => val.toUpperCase()),
      new Commander.Option(
        '--log_show [show]',
        'Enable log message output of log level, date and emitting package. ' +
          'Can comma separate ' +
          colors.blue('level|package|reqId|utc|locale|elapsed|all') +
          '. E.g. ' +
          colors.green('--log_show level,elapsed,package') +
          ', or ' +
          colors.green('--log_show all') +
          ' or the equivalent ' +
          colors.green('-A'),
      ).argParser(commaList),
      new Commander.Option('-A --showall', 'Shortcut for ' + colors.green('--log_show all')),
      new Commander.Option('-V --verbose', 'Shortcut for ' + colors.green('--log verbose')),
      new Commander.Option('-D --debug', 'Shortcut for ' + colors.green('--log debug')),
      new Commander.Option('-T --trace', 'Shortcut for ' + colors.green('--log trace')),
      new Commander.Option('-S --spam', 'Shortcut for ' + colors.green('--log spam')),
    ];
    options.forEach((option) => {
      this.addOption(option);
    });
    return this;
  }

  /**
   * Adds a `--dry-run` option to the command.
   * This is a common pattern in CLI tools to simulate execution without making actual changes.
   *
   * @returns {this} The current instance of the command, allowing for method chaining.
   */
  addDryRun(): this {
    const option: Commander.Option = new Commander.Option(
      '-n --dry-run',
      'Do not modify any existing data or files',
    ).default(false);
    this.addOption(option);
    return this;
  }

  /**
   * Adds a `--recursive` option to the command, allowing for recursive processing of files and directories.
   * The option can optionally accept a depth level.
   *
   * @returns {this} The current instance of the command, allowing for method chaining.
   */
  addRecursion(): this {
    const option: Commander.Option = new Commander.Option(
      '-R, --recursive [depth]',
      'Recursively process files and folders. ' + colors.yellow('[depth]') + ' is the recursion depth.',
    )
      .default(1)
      .argParser((val) => _.asInt(val, 1));
    this.addOption(option);
    return this;
  }

  /**
   * Adds a `files` argument to the command, allowing it to accept a list of file paths.
   * This is useful for commands that operate on a set of files.
   *
   * @returns {this} The current instance of the command, allowing for method chaining.
   */
  addFiles(): this {
    const argument: Commander.Argument = new Commander.Argument(
      '<files...>',
      'Use glob * to get a list of files in the current directory',
    );
    this.addArgument(argument);
    return this;
  }

  /**
   * Parses command-line options from `Deno.args`.
   * This method integrates with Deno's runtime to capture and parse arguments passed to the script.
   *
   * @returns {Opts} The parsed command-line options as a `CliOpts` object.
   */
  async parseOpts(): Promise<Opts> {
    await super.parseAsync(['xx', 'yy', ...Deno.args]);
    return this.opts() as Opts;
  }
}
