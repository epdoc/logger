import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import pkg from '../cliapp/deno.json' with { type: 'json' };

// Define project-specific logging methods
const AppBuilder = Console.extender({
  fileOp(operation: string, path: string) {
    return this.text('📁 ').text(operation).text(' ').path(path);
  },

  apiCall(method: string, endpoint: string) {
    return this.text('🌐 ').text(method).text(' ').url(endpoint);
  },

  progress(current: number, total: number) {
    const percent = Math.round((current / total) * 100);
    return this.text(`⏳ Progress: ${current}/${total} (${percent}%)`);
  },
});

type MsgBuilder = InstanceType<typeof AppBuilder>;
type Logger = Log.Std.Logger<MsgBuilder>;

// Bundle context types together
type AppBundle = CliApp.Cmd.ContextBundle<AppContext, MsgBuilder, Logger>;

interface ProcessOptions {
  verbose?: boolean;
}

class AppContext extends CliApp.Ctx.Base<MsgBuilder, Logger> {
  // Add application state
  processedFiles = 0;

  constructor() {
    super(pkg);
    this.setupLogging();
  }

  setupLogging() {
    this.logMgr = Log.createLogManager(AppBuilder, { threshold: 'info' });
    this.log = this.logMgr.getLogger<Logger>();
  }

  // Helper methods using custom msgbuilder
  logFileOperation(op: string, path: string) {
    this.log.info.fileOp(op, path).emit();
    this.processedFiles++;
  }
}

// Use the bundled type for commands
class ProcessCmd extends CliApp.Cmd.Sub<AppBundle, ProcessOptions> {
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

class AppRootCmd extends CliApp.Cmd.Root<AppBundle, { verbose?: boolean }> {
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
  const rootCmd = new AppRootCmd(ctx);
  const cmd = await rootCmd.init();
  await cmd.parseAsync();
}
