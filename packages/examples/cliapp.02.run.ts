import * as CliApp from '../cliapp/src/mod.ts';
import * as Log from '../logger/src/mod.ts';
import { Console } from '../msgbuilder/src/mod.ts';
import pkg from './deno.json' with { type: 'json' };

// Custom MsgBuilder with additional methods
class AppBuilder extends Console.Builder {
  fileOp(operation: string, path: string) {
    return this.text('📁 ').text(operation).text(' ').value(path);
  }
  status(type: 'success' | 'error' | 'info') {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    return this.text(icon).text(' ');
  }
}

type Logger = Log.Std.Logger<AppBuilder>;

// Context extending base Context class with custom types
class AppContext extends CliApp.Context<AppBuilder, Logger> {
  processedFiles = 0;

  override async setupLogging() {
    this.logMgr = new Log.Mgr<AppBuilder>();
    this.logMgr.msgBuilderFactory = (emitter) => new AppBuilder(emitter);
    this.log = await this.logMgr.getLogger<Logger>();
  }

  logFileOperation(op: string, path: string) {
    this.log.info.fileOp(op, path).emit();
    this.processedFiles++;
  }

  logStatus(type: 'success' | 'error' | 'info', message: string) {
    this.log.info.status(type).text(message).emit();
  }
}

// Option types
type RootOptions = CliApp.LogOptions & {
  config?: string;
  quiet?: boolean;
  dryRun?: boolean;
};

type ProcessOptions = {
  input?: string;
  pattern?: string;
  verbose?: boolean;
};

type CleanOptions = {
  force?: boolean;
  dryRun?: boolean;
};

// Root command
class RootCommand extends CliApp.BaseCommand<AppContext, AppContext, RootOptions> {
  constructor(initialContext?: AppContext) {
    super(undefined, initialContext, true, true); // Mark as root, add dry-run
  }

  defineMetadata() {
    this.commander.name(pkg.name);
    this.commander.version(pkg.version);
    this.commander.description(pkg.description);
  }

  defineOptions() {
    this.commander.option('--config <file>', 'Configuration file');
    this.commander.option('--quiet', 'Suppress output');
  }

  createContext(parent?: AppContext) {
    return parent || this.parentContext!;
  }

  hydrateContext(options: RootOptions) {
    if (options.quiet) {
      this.ctx.logMgr.threshold = 'error';
    }
    if (options.dryRun) {
      this.ctx.dryRun = true;
    }
  }

  execute() {
    this.ctx.log.info.h1('File Processor').emit();
    this.ctx.logStatus('info', 'Use subcommands: process, clean');
  }

  protected override getSubCommands() {
    return [new ProcessCommand(), new CleanCommand()];
  }
}

// Process command
class ProcessCommand extends CliApp.BaseCommand<AppContext, AppContext, ProcessOptions> {
  defineMetadata() {
    this.commander.name('process');
    this.commander.description('Process files in a directory');
  }

  defineOptions() {
    this.commander.argument('[files...]', 'Files to process');
    this.commander.option('--input <dir>', 'Input directory', '.');
    this.commander.option('--pattern <glob>', 'File pattern', '*.txt');
    this.commander.option('--verbose', 'Verbose output');
  }

  createContext(parent?: AppContext) {
    return parent!;
  }

  hydrateContext(options: ProcessOptions) {
    if (options.verbose) {
      this.ctx.logMgr.threshold = 'debug';
    }
  }

  execute(opts: ProcessOptions, files: string[]) {
    this.ctx.log.info.h1('File Processing')
      .label('Directory:').value(opts.input || '.')
      .label('Pattern:').value(opts.pattern || '*.txt')
      .emit();

    const filesToProcess = files.length > 0 ? files : ['file1.txt', 'file2.txt'];
    this.ctx.log.info.text(`Processing ${filesToProcess.length} files...`).emit();

    for (const file of filesToProcess) {
      this.ctx.logFileOperation('PROCESS', `${opts.input || '.'}/${file}`);
      if (opts.verbose) {
        this.ctx.log.debug.text(`Processing details for ${file}`).emit();
      }
    }

    this.ctx.logStatus('success', `Processed ${this.ctx.processedFiles} files successfully`);
  }
}

// Clean command
class CleanCommand extends CliApp.BaseCommand<AppContext, AppContext, CleanOptions> {
  defineMetadata() {
    this.commander.name('clean');
    this.commander.description('Clean temporary files');
  }

  defineOptions() {
    this.commander.argument('[target]', 'Target directory', '.');
    this.commander.option('--force', 'Force deletion');
  }

  createContext(parent?: AppContext) {
    return parent!;
  }

  hydrateContext(_options: CleanOptions) {
    // Inherit dry-run from parent context
  }

  execute(opts: CleanOptions, target: string[]) {
    const targetDir = target[0] || '.';
    this.ctx.log.info.h1('Cleanup Operation')
      .label('Target:').value(targetDir)
      .label('Force:').value(opts.force ? 'Yes' : 'No')
      .label('Dry Run:').value(this.ctx.dryRun ? 'Yes' : 'No')
      .emit();

    const tempFiles = ['temp1.tmp', 'temp2.tmp', 'cache.dat'];

    for (const file of tempFiles) {
      const fullPath = `${targetDir}/${file}`;
      if (this.ctx.dryRun) {
        this.ctx.log.info.text('Would delete: ').fileOp('DELETE', fullPath).emit();
      } else {
        this.ctx.logFileOperation('DELETE', fullPath);
      }
    }

    const message = this.ctx.dryRun
      ? `Would delete ${tempFiles.length} files`
      : `Deleted ${tempFiles.length} files`;
    this.ctx.logStatus('success', message);
  }
}

// Run your application
if (import.meta.main) {
  const ctx = new AppContext(pkg);
  await ctx.setupLogging();

  const cmd = new RootCommand(ctx);

  await CliApp.run<AppContext>(ctx, cmd);
}
