import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';

// 1. Define types once per project
type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

// 2. Create your context
class AppContext extends CliApp.Ctx.Base<Logger> {
  constructor() {
    super({
      name: 'cliapp.01.run.ts',
      version: '0.1.0',
      description: 'CliApp Example 01 - Context and a Root Commmand',
    });
  }

  async setupLogging() {
    this.logMgr = new Log.Mgr<Console.Builder>();
    this.log = await this.logMgr.getLogger<Logger>();
  }
}

// 3. Define options interface
type AppOptions = CliApp.LogOptions & {
  verbose?: boolean;
  output?: string;
};

// 4. Define your root command
class AppRootCmd extends CliApp.Cmd.Root<CliApp.Cmd.ContextBundle<AppContext>, AppOptions> {
  constructor(ctx: AppContext) {
    super(ctx, ctx.pkg);
  }

  get log(): Logger {
    return this.ctx.log;
  }

  // Add arguments, if you have any
  protected override addArguments(): void {
    this.cmd.argument('[files...]', 'Files to process');
  }

  // Add options, including the standard CliApp logging options
  protected override addOptions(): void {
    this.cmd
      .addLogging(this.ctx)
      .option('--output <dir>', 'Output directory');
  }

  // Add extras is where logging options are applied
  protected override addExtras(): void {
    this.cmd.hook('preAction', (cmd) => {
      const opts = cmd.optsWithGlobals() as AppOptions;
      // Configure the logging options before any subcommands are executed
      CliApp.configureLogging(this.ctx, opts);

      // this.log.info.section('CliApp Example 01 - Context and a Root Commmand').emit();

      // const transports = this.ctx.logMgr.transportMgr.transports.map((transport) => transport.toString());
      // this.log.info.label('Transports:').value(transports.join(', ')).emit();
      // this.log.info.label('Threshold:').value(this.ctx.logMgr.threshold).value(
      //   this.ctx.logMgr.logLevels.asName(this.ctx.logMgr.threshold),
      // ).emit();
      // this.log.info.label('Show:').value(JSON.stringify(this.ctx.logMgr.show)).emit();
      // this.log.error.error('This is an error message').emit();
      // this.log.debug.text('This is a debug message').emit();
      // this.log.verbose.text('This is a verbose message').emit();
      // this.log.spam.text('This is a spam message').emit();
    });
  }

  protected override executeAction(
    args: string[],
    opts: AppOptions,
  ): Promise<void> {
    this.log.info.section('CliApp Example 01 - Context and a Root Commmand').emit();

    const transports = this.ctx.logMgr.transportMgr.transports.map((transport) => transport.toString());
    this.log.info.label('Transports:').value(transports.join(', ')).emit();
    this.log.info.label('Threshold:').value(this.ctx.logMgr.threshold).value(
      this.ctx.logMgr.logLevels.asName(this.ctx.logMgr.threshold),
    ).emit();
    this.log.info.label('Show:').value(JSON.stringify(this.ctx.logMgr.show)).emit();
    this.log.error.error('This is an error message').emit();
    this.log.debug.text('This is a debug message').emit();
    this.log.verbose.text('This is a verbose message').emit();
    this.log.spam.text('This is a spam message').emit();

    this.ctx.log.info.section('Processing Files').emit();
    this.ctx.log.info.label('Files:').value(args.join(', '))
      .label('Output:').value(opts.output || 'default')
      .emit();
    return Promise.resolve();
  }
}

// 5. Run it
if (import.meta.main) {
  // Create context and setup logging
  const ctx = new AppContext();
  await ctx.setupLogging();
  // Create our root command and initialize
  const rootCmd = new AppRootCmd(ctx);
  const cmd = await rootCmd.init();
  // Wrap "await cmd.parseAsync()" in CliApp.run to cleanly handle errors, shutdown, etc.
  await CliApp.run(ctx, () => cmd.parseAsync());
}
