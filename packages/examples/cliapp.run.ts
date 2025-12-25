/**
 * @file Basic CLI app using BaseContext and structured commands
 * @description Demonstrates the BaseContext pattern with Cmd.Sub and Cmd.Root for CLI applications
 *
 * Key features demonstrated:
 * - BaseContext extension with custom msgbuilder types
 * - Structured command classes using Cmd.Sub and Cmd.Root
 * - Type-safe option parsing with proper TypeScript interfaces
 * - Command arguments and options
 * - Root options available to all subcommands
 * - Custom logging with project-specific message builders
 * - Real-world CLI patterns (file processing, cleanup operations)
 */

import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import pkg from '../cliapp/deno.json' with { type: 'json' };

// 1. Define custom msgbuilder with project-specific methods
const AppBuilder = Console.extender({
  fileOp(operation: string, path: string) {
    return this.text('📁 ').text(operation).text(' ').path(path);
  },

  status(type: 'success' | 'error' | 'info') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    return this.text(icons[type]).text(' ');
  },
});

// 2. Define types once per project
// If NOT extending Console.Builder, use:
//   type MsgBuilder = Console.Builder;
//   type Logger = Log.Std.Logger<MsgBuilder>;
// And in setupLogging(), use: Log.createLogManager(Console.Builder, { threshold: 'info' });
type MsgBuilder = InstanceType<typeof AppBuilder>;
type Logger = Log.Std.Logger<MsgBuilder>;

// 3. Extend BaseContext with your specific types
class AppContext extends CliApp.Ctx.Base<MsgBuilder, Logger> {
  // Add project-specific properties
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

  logStatus(type: 'success' | 'error' | 'info', message: string) {
    this.log.info.status(type).text(message).emit();
  }
}

// 4. Define option interfaces
interface ProcessOptions {
  input?: string;
  pattern?: string;
  verbose?: boolean;
}

interface CleanOptions {
  dryRun?: boolean;
  force?: boolean;
}

interface RootOptions {
  config?: string;
  quiet?: boolean;
}

// 5. Define commands using structured command classes
// NOTE: The four generics here are verbose - this is a known limitation
// that could be improved with a bundled context type in future versions
class ProcessCmd extends CliApp.Cmd.Sub<AppContext, ProcessOptions, MsgBuilder, Logger> {
  constructor(ctx: AppContext) {
    super(ctx, 'process', 'Process files in a directory');
  }

  protected override addArguments(): void {
    this.cmd.argument('[files...]', 'Files to process');
  }

  protected override addOptions(): void {
    this.cmd
      .option('--input <dir>', 'Input directory', '.')
      .option('--pattern <glob>', 'File pattern', '*.txt')
      .option('--verbose', 'Verbose output');
  }

  protected override async executeAction(args: string[], opts: ProcessOptions): Promise<void> {
    if (opts.verbose) {
      this.ctx.logMgr.threshold = 'debug';
    }

    this.ctx.log.info.h1('File Processing')
      .label('Directory:').value(opts.input || '.')
      .label('Pattern:').value(opts.pattern || '*.txt')
      .emit();

    try {
      // Use provided files or discover files
      const filesToProcess = args.length > 0 ? args : ['file1.txt', 'file2.txt', 'file3.txt'];

      this.ctx.log.info.text(`Processing ${filesToProcess.length} files...`).emit();

      for (const file of filesToProcess) {
        this.ctx.logFileOperation('PROCESS', `${opts.input || '.'}/${file}`);

        if (opts.verbose) {
          this.ctx.log.debug.text(`Processing details for ${file}`).emit();
        }

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      this.ctx.logStatus('success', `Processed ${this.ctx.processedFiles} files successfully`);
    } catch (error) {
      this.ctx.logStatus('error', `Processing failed: ${(error as Error).message}`);
    }
  }
}

class CleanCmd extends CliApp.Cmd.Sub<AppContext, CleanOptions, MsgBuilder, Logger> {
  constructor(ctx: AppContext) {
    super(ctx, 'clean', 'Clean temporary files');
  }

  protected override addArguments(): void {
    this.cmd.argument('[target]', 'Target directory to clean');
  }

  protected override addOptions(): void {
    this.cmd
      .option('--dry-run', 'Show what would be deleted')
      .option('--force', 'Force deletion without confirmation');
  }

  protected override async executeAction(args: string[], opts: CleanOptions): Promise<void> {
    this.ctx.dryRun = opts.dryRun || false;

    const targetDir = args[0] || '.';

    this.ctx.log.info.h1('Cleanup Operation')
      .label('Target:').value(targetDir)
      .label('Dry Run:').value(this.ctx.dryRun ? 'Yes' : 'No')
      .label('Force:').value(opts.force ? 'Yes' : 'No')
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

    const message = this.ctx.dryRun ? `Would delete ${tempFiles.length} files` : `Deleted ${tempFiles.length} files`;
    this.ctx.logStatus('success', message);
  }
}

// 6. Create root command with subcommands
class FileProcessorRoot extends CliApp.Cmd.Root<AppContext, RootOptions, MsgBuilder, Logger> {
  constructor(ctx: AppContext) {
    super(ctx, pkg);
  }

  protected override addArguments(): void {
    this.cmd.argument('[command]', 'Command to run (if not using subcommands)');
  }

  protected override addOptions(): void {
    this.cmd
      .option('--config <file>', 'Configuration file')
      .option('--quiet', 'Suppress output');
  }

  protected override async addCommands(): Promise<void> {
    const processCmd = new ProcessCmd(this.ctx);
    const cleanCmd = new CleanCmd(this.ctx);

    this.cmd.addCommand(await processCmd.init());
    this.cmd.addCommand(await cleanCmd.init());
  }

  protected override addExtras(): void {
    this.cmd.addHelpText('after', '\nExamples:\n  $ file-processor process *.txt --verbose\n  $ file-processor clean --dry-run');
  }

  protected override async executeAction(args: string[], opts: RootOptions): Promise<void> {
    if (opts.quiet) {
      this.ctx.logMgr.threshold = 'error';
    }

    if (opts.config) {
      this.ctx.logStatus('info', `Using config file: ${opts.config}`);
    }

    this.ctx.log.info.h1('File Processor')
      .text('Use --help to see available commands')
      .emit();

    if (args.length > 0) {
      this.ctx.logStatus('info', `Command argument provided: ${args[0]}`);
    }

    this.ctx.logStatus('info', 'Ready to process files');
  }
}

// 7. Run the application
if (import.meta.main) {
  const ctx = new AppContext();
  const rootCmd = new FileProcessorRoot(ctx);
  const cmd = await rootCmd.init();
  await cmd.parseAsync();
}
