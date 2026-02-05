import * as Commander from 'commander';
import type * as Ctx from './context.ts';
import type * as CliApp from './types.ts';
import { configureLogging } from './utils.ts';

export abstract class BaseCommand<
  TContext extends TParentContext,
  TParentContext extends Ctx.ICtx = Ctx.ICtx,
  TOpts extends CliApp.CmdOptions = CliApp.CmdOptions,
> {
  public commander: Commander.Command;
  protected ctx!: TContext;
  protected parentContext?: TParentContext;
  #isRoot = false;
  #subCommands?: BaseCommand<TContext, TContext>[];

  constructor(name?: string, initialContext?: TParentContext) {
    this.commander = new Commander.Command(name);
    this.parentContext = initialContext;

    this.defineMetadata();
    this.defineOptions();

    // Detect if this is a root command
    this.#isRoot = !this.commander.parent;

    // Add logging options for root commands
    if (this.#isRoot) {
      this.#addLoggingOptions();
    }

    // Register subcommands early so they're available for parsing
    this.registerSubCommands();

    // The middleware chain - runs after parsing, before action
    this.commander.hook('preAction', (_thisCommand: Commander.Command, _actionCommand: Commander.Command) => {
      // 1. Create the context instance for this specific level
      this.ctx = this.createContext(this.parentContext);

      // 2. Hydrate context using parsed options for this command
      const opts = this.commander.opts() as TOpts;
      this.hydrateContext(opts);

      // 3. Configure logging for root commands
      if (this.#isRoot) {
        configureLogging(this.ctx, opts as CliApp.LogOptions);
      }

      // 4. Pass this context down to subcommands so they can inherit
      const subCommands = this.#getCachedSubCommands();
      subCommands.forEach((sub) => {
        sub.setParentContext(this.ctx);
      });
    });

    // Final execution
    this.commander.action(async (...params: unknown[]) => {
      // Commander.js passes: ...args, options, command
      // For variadic args like <files...>, they come as a single array parameter
      // We want: options, args (flattened)
      const opts = params[params.length - 2] as TOpts;
      const rawArgs = params.slice(0, -2);
      // Flatten if first arg is an array (variadic argument)
      const args = (rawArgs.length === 1 && Array.isArray(rawArgs[0])) ? rawArgs[0] as string[] : rawArgs as string[];
      await this.execute(opts, args);
    });
  }

  // --- Methods to be overridden by your subclasses ---

  abstract defineMetadata(): void; // Set name, description, version
  abstract defineOptions(): void; // Define flags/options
  abstract createContext(parent?: TParentContext): TContext; // Instantiate Ctx class
  abstract hydrateContext(options: TOpts): void; // Map options to this.context
  abstract execute(opts: TOpts, args: CliApp.CmdArgs): Promise<void> | void;

  protected getSubCommands(): BaseCommand<TContext, TContext>[] {
    return []; // Override to return an array of child command instances
  }

  // --- Internal Wiring ---

  public setParentContext(ctx: TParentContext) {
    this.parentContext = ctx;
  }

  #getCachedSubCommands(): BaseCommand<TContext, TContext>[] {
    if (!this.#subCommands) {
      this.#subCommands = this.getSubCommands();
    }
    return this.#subCommands;
  }

  public registerSubCommands() {
    const subCommands = this.#getCachedSubCommands();
    subCommands.forEach((sub) => {
      sub.registerSubCommands(); // Recursive registration
      this.commander.addCommand(sub.commander);
    });
  }

  #addLoggingOptions(): void {
    const options: Commander.Option[] = [
      new Commander.Option('--log-level <level>', 'Set the threshold log output level.')
        .choices(['FATAL', 'CRITICAL', 'ERROR', 'WARN', 'INFO', 'VERBOSE', 'DEBUG', 'TRACE', 'SPAM', 'SILLY'])
        .argParser((val) => val.toUpperCase()),
      new Commander.Option('--verbose', 'Shortcut for --log verbose'),
      new Commander.Option('-D, --debug', 'Shortcut for --log debug'),
      new Commander.Option('-T, --trace', 'Shortcut for --log trace'),
      new Commander.Option('-S, --spam', 'Shortcut for --log spam'),
      new Commander.Option('--log_show [show]', 'Enable log message output properties')
        .default('level'),
      new Commander.Option('-A, --log-show-all', 'Shortcut for --log_show all'),
      new Commander.Option('--no-color', 'Do not show color in output'),
    ];

    for (const option of options) {
      this.commander.addOption(option);
    }
  }
}
