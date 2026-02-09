import type * as Log from '@epdoc/logger';
import pkg from '../deno.json' with { type: 'json' };
import * as CliApp from '../src/mod.ts';

type M = CliApp.Ctx.MsgBuilder;
type L = CliApp.Ctx.Logger;

// Custom MsgBuilder with additional methods
class AppBuilder extends CliApp.Ctx.MsgBuilder {
  fileOp(operation: string, path: string) {
    return this.text('📁 ').text(operation).text(' ').value(path);
  }
  status(type: 'success' | 'error' | 'info') {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    return this.text(icon).text(' ');
  }
}

type Logger = Log.Std.Logger<AppBuilder>;

class AppContext extends CliApp.Context<AppBuilder, Logger> {
  processedFiles = 0;
  protected override builderClass = AppBuilder;

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
    super(initialContext, { ...pkg, root: true, dryRun: true }); // Mark as root, add dry-run
  }

  override async defineOptions(): Promise<void> {
    await Promise.resolve();
    this.commander.option('--config <file>', 'Configuration file');
    this.commander.option('--quiet', 'Suppress output');
  }

  override createContext(parent?: AppContext) {
    return parent || this.parentContext!;
  }

  override hydrateContext(options: RootOptions) {
    if (options.quiet) {
      this.ctx.logMgr.threshold = 'error';
    }
    if (options.dryRun) {
      this.ctx.dryRun = true;
    }
  }

  override execute() {
    this.ctx.log.info.h1('File Processor').emit();
    this.ctx.logStatus('info', 'Use subcommands: process, clean');
  }

  protected override getSubCommands() {
    return [new ProcessCommand(), new CleanCommand()];
  }
}

// Process command
class ProcessCommand extends CliApp.BaseCommand<AppContext, AppContext, ProcessOptions> {
  constructor() {
    super(undefined, { name: 'process' });
  }
  override async defineOptions(): Promise<void> {
    await Promise.resolve();
    this.commander.argument('[files...]', 'Files to process');
    this.commander.option('--input <dir>', 'Input directory', '.');
    this.commander.option('--pattern <glob>', 'File pattern', '*.txt');
    this.commander.option('--verbose', 'Verbose output');
  }

  override createContext(parent?: AppContext) {
    return parent!;
  }

  override hydrateContext(options: ProcessOptions) {
    if (options.verbose) {
      this.ctx.logMgr.threshold = 'debug';
    }
  }

  override execute(opts: ProcessOptions, files: string[]) {
    this.ctx.log.info.h1('File Processing')
      .label('Directory:').value(opts.input || '.')
      .label('Pattern:').value(opts.pattern || '*.txt')
      .emit();

    const filesToProcess = files.length > 0 ? files : ['file1.txt', 'file2.txt'];
    this.ctx.log.info.text(`Processing ${filesToProcess.length} files...`)
      .emit();

    for (const file of filesToProcess) {
      this.ctx.logFileOperation('PROCESS', `${opts.input || '.'}/${file}`);
      if (opts.verbose) {
        this.ctx.log.debug.text(`Processing details for ${file}`).emit();
      }
    }

    this.ctx.logStatus(
      'success',
      `Processed ${this.ctx.processedFiles} files successfully`,
    );
  }
}

// Clean command
class CleanCommand extends CliApp.BaseCommand<AppContext, AppContext, CleanOptions> {
  constructor() {
    super(undefined, { name: 'clean' });
  }
  override async defineOptions(): Promise<void> {
    await Promise.resolve();
    this.commander.argument('[target]', 'Target directory', '.');
    this.commander.option('--force', 'Force deletion');
  }

  override createContext(parent?: AppContext) {
    return parent!;
  }

  override hydrateContext(_options: CleanOptions) {
    // Inherit dry-run from parent context
  }

  override execute(opts: CleanOptions, target: string[]) {
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
        this.ctx.log.info.text('Would delete: ').fileOp('DELETE', fullPath)
          .emit();
      } else {
        this.ctx.logFileOperation('DELETE', fullPath);
      }
    }

    const message = this.ctx.dryRun ? `Would delete ${tempFiles.length} files` : `Deleted ${tempFiles.length} files`;
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
