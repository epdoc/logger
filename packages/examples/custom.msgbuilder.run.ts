import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import pkg from '../cliapp/deno.json' with { type: 'json' };

// Define project-specific logging methods
class AppBuilder extends Console.Builder {
  constructor(emitter: Log.IEmitter) {
    super(emitter as any);
  }

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

interface ProcessOptions {
  verbose?: boolean;
}

class AppContext extends CliApp.Ctx.Base<Logger> {
  // Add application state
  processedFiles = 0;

  constructor() {
    super(pkg);
    this.setupLogging();
  }

  async setupLogging() {
    this.logMgr = new Log.Mgr<AppBuilder>();
    this.logMgr.msgBuilderFactory = (emitter) => new AppBuilder(emitter as any);
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

// Use the bundled type for commands
class ProcessCmd extends CliApp.Cmd.Sub<CliApp.Cmd.ContextBundle<AppContext>, ProcessOptions> {
  constructor(ctx: AppContext) {
    super(ctx, 'process', 'Process files');
  }

  protected override addArguments(): void {
    this.cmd.argument('[files...]', 'Files to process');
  }

  protected override addOptions(): void {
    this.cmd.option('--verbose', 'Verbose output');
  }

  protected override executeAction(_args: string[], _opts: ProcessOptions): Promise<void> {
    for (const file of _args) {
      this.ctx.logFileOperation('PROCESS', file);
    }
    this.ctx.log.info.progress(_args.length, _args.length).emit();
    return Promise.resolve();
  }
}

class AppRootCmd extends CliApp.Cmd.Root<CliApp.Cmd.ContextBundle<AppContext>, { verbose?: boolean }> {
  constructor(ctx: AppContext) {
    super(ctx, ctx.pkg);
  }

  protected override async addCommands(): Promise<void> {
    const processCmd = new ProcessCmd(this.ctx);
    this.cmd.addCommand(await processCmd.init());
  }

  protected override executeAction(_args: string[], _opts: { verbose?: boolean }): Promise<void> {
    this.ctx.log.info.h1('Custom Message Builder Example')
      .text('Use --help for commands')
      .emit();
    return Promise.resolve();
  }
}

if (import.meta.main) {
  const ctx = new AppContext();
  await ctx.setupLogging();
  const rootCmd = new AppRootCmd(ctx);
  const cmd = await rootCmd.init();
  await cmd.parseAsync();
}
