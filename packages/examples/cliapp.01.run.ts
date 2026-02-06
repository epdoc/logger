import * as CliApp from '../cliapp/src/mod.ts';
import * as Log from '../logger/src/mod.ts';
import pkg from './deno.json' with { type: 'json' };

// Define your contexts
class RootContext extends CliApp.Context {
  debugMode = false;

  async setupLogging() {
    this.logMgr = new Log.Mgr<CliApp.Ctx.MsgBuilder>();
    this.logMgr.initLevels();
    this.logMgr.threshold = 'info';
    this.log = await this.logMgr.getLogger<CliApp.Ctx.Logger>();
  }
}

class ChildContext extends RootContext {
  processedFiles = 0;

  constructor(parent: RootContext, params?: Log.IGetChildParams) {
    super(parent, params);
    // Inherit custom properties from parent
    this.debugMode = parent.debugMode;
  }
}

type RootOptions = CliApp.LogOptions & { rootOption: boolean };
type SubOptions = { subOption: boolean };

// Define your commands using BaseCommand
class RootCommand extends CliApp.BaseCommand<RootContext, RootContext, RootOptions> {
  constructor(initialContext: RootContext) {
    super(undefined, initialContext, true); // Mark as root
  }

  defineMetadata(): void {
    this.commander.name(pkg.name);
    this.commander.version(pkg.version);
    this.commander.description(pkg.description);
  }

  defineOptions(): void {
    this.commander.option('--root-option', 'Example root command option');
  }

  createContext(parent?: RootContext): RootContext {
    // Use the initial context passed in constructor
    return parent || this.parentContext!;
  }

  hydrateContext(options: RootOptions): void {
    this.ctx.debugMode = options.rootOption;
  }

  execute(_opts: RootOptions, _args: CliApp.CmdArgs): void {
    // Root command with no subcommand - show help
    this.commander.help();
  }

  protected override getSubCommands(): CliApp.BaseCommand<ChildContext, RootContext>[] {
    return [new SubCommand()];
  }
}

class SubCommand extends CliApp.BaseCommand<ChildContext, RootContext, SubOptions> {
  defineMetadata(): void {
    this.commander.name('process');
    this.commander.description('Process files');
  }

  defineOptions(): void {
    this.commander.argument('<files...>', 'Files to process');
    this.commander.option('--sub-option', 'Example subcommand option');
  }

  createContext(parent?: RootContext): ChildContext {
    if (!parent) {
      throw new Error('SubCommand requires parent context');
    }
    return new ChildContext(parent, { pkg: 'child' });
  }

  hydrateContext(_options: SubOptions): void {
    // No additional hydration needed for this subcommand
  }

  execute(opts: SubOptions, args: CliApp.CmdArgs): void {
    const files = args;

    this.ctx.log.info.h1('Processing:').emit();
    this.ctx.log.indent();
    this.ctx.log.info.label('Sub option:').value(opts.subOption).emit();
    this.ctx.log.info.label('Files:').count(files.length).value('file').emit();
    this.ctx.log.debug.label('Root option (from parent):').value(this.ctx.debugMode).emit();
    this.ctx.log.outdent();

    // Process files...
    this.ctx.processedFiles = files.length;
  }
}

// Run your application
if (import.meta.main) {
  // Create initial context for logging setup
  const initialCtx = new RootContext(pkg);
  await initialCtx.setupLogging();

  const rootCmd = new RootCommand(initialCtx);

  await CliApp.run(initialCtx, rootCmd);
}
