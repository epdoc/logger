import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import pkg from '../cliapp/deno.json' with { type: 'json' };

// Define project-specific logging methods
class AppBuilder extends Console.Builder {
  fileOp(operation: string, path: string) {
    return this.text('📁 ').text(operation).text(' ').path(path);
  }

  apiCall(method: string, endpoint: string) {
    return this.text('🌐 ').text(method).text(' ').url(endpoint);
  }

  progress(current: number, total: number) {
    const percent = Math.round((current / total) * 100);
    return this.text(`⏳ Progress: ${current}/${total} (${percent}%)`);
  }
}

type Logger = Log.Std.Logger<AppBuilder>;

interface ProcessOptions extends CliApp.CmdOptions {
  verbose?: boolean;
}

class AppContext extends CliApp.Context<Logger> {
  // Add application state
  processedFiles = 0;

  override async setupLogging() {
    this.logMgr = new Log.Mgr<AppBuilder>();
    this.logMgr.msgBuilderFactory = (emitter) => new AppBuilder(emitter);
    this.logMgr.initLevels(Log.Std.factoryMethods);
    this.logMgr.threshold = 'info';
    this.log = await this.logMgr.getLogger<Logger>();
  }

  // Helper methods using custom msgbuilder
  logFileOperation(op: string, path: string) {
    this.log.info.fileOp(op, path).emit();
    this.processedFiles++;
  }
}

class RootCommand extends CliApp.BaseCommand<AppContext, AppContext, { verbose?: boolean } & CliApp.CmdOptions> {
  constructor(initialContext: AppContext) {
    super(undefined, initialContext, true);
  }

  defineMetadata(): void {
    this.commander.name(pkg.name);
    this.commander.version(pkg.version);
    this.commander.description('Custom Message Builder Example');
  }

  defineOptions(): void {}

  createContext(parent?: AppContext): AppContext {
    return parent || this.parentContext!;
  }

  hydrateContext(): void {}

  execute(): void {
    this.ctx.log.info.h1('Custom Message Builder Example')
      .text('Use --help for commands')
      .emit();
  }

  protected override getSubCommands(): CliApp.BaseCommand<AppContext, AppContext>[] {
    return [new ProcessCmd()];
  }
}

class ProcessCmd extends CliApp.BaseCommand<AppContext, AppContext, ProcessOptions> {
  defineMetadata(): void {
    this.commander.name('process');
    this.commander.description('Process files');
  }

  defineOptions(): void {
    this.commander.argument('[files...]', 'Files to process');
    this.commander.option('--verbose', 'Verbose output');
  }

  createContext(parent?: AppContext): AppContext {
    return parent!;
  }

  hydrateContext(): void {}

  execute(opts: ProcessOptions, args: string[]): void {
    for (const file of args) {
      this.ctx.logFileOperation('PROCESS', file);
    }
    this.ctx.log.info.progress(args.length, args.length).emit();
  }
}

if (import.meta.main) {
  const ctx = new AppContext(pkg);
  await ctx.setupLogging();

  const rootCmd = new RootCommand(ctx);
  await CliApp.run(ctx, rootCmd);
}
