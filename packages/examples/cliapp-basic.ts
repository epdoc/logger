/**
 * @file Basic CLI app using BaseContext
 * @description Demonstrates the simplified BaseContext pattern for CLI applications
 * 
 * Key features demonstrated:
 * - BaseContext extension with custom msgbuilder types
 * - Declarative API with arguments and options
 * - Type-safe option parsing with separate declaration pattern
 * - Command arguments (variadic and optional)
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

// 4. Define commands using declarative API with arguments
const processCmd = CliApp.Declarative.defineCommand({
  name: 'process',
  description: 'Process files in a directory',
  arguments: [
    { name: 'files', description: 'Files to process', variadic: true, required: false }
  ],
  options: {
    input: CliApp.Declarative.option.path('--input <dir>', 'Input directory').default('.'),
    pattern: CliApp.Declarative.option.string('--pattern <glob>', 'File pattern').default('*.txt'),
    verbose: CliApp.Declarative.option.boolean('--verbose', 'Verbose output'),
  },
  async action(ctx, args, opts) {
    const appCtx = ctx as unknown as AppContext;
    if (opts.verbose) {
      appCtx.logMgr.threshold = 'debug';
    }

    appCtx.log.info.h1('File Processing')
      .label('Directory:').value(opts.input)
      .label('Pattern:').value(opts.pattern)
      .emit();

    try {
      // Use provided files or discover files
      const filesToProcess = args.length > 0 ? args : ['file1.txt', 'file2.txt', 'file3.txt'];

      appCtx.log.info.text(`Processing ${filesToProcess.length} files...`).emit();

      for (const file of filesToProcess) {
        appCtx.logFileOperation('PROCESS', `${opts.input}/${file}`);

        if (opts.verbose) {
          appCtx.log.debug.text(`Processing details for ${file}`).emit();
        }

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      appCtx.logStatus('success', `Processed ${appCtx.processedFiles} files successfully`);
    } catch (error) {
      appCtx.logStatus('error', `Processing failed: ${(error as Error).message}`);
    }
  },
});

const cleanCmd = CliApp.Declarative.defineCommand({
  name: 'clean',
  description: 'Clean temporary files',
  arguments: [
    { name: 'target', description: 'Target directory to clean', required: false }
  ],
  options: {
    dryRun: CliApp.Declarative.option.boolean('--dry-run', 'Show what would be deleted'),
    force: CliApp.Declarative.option.boolean('--force', 'Force deletion without confirmation'),
  },
  async action(ctx, args, opts) {
    const appCtx = ctx as unknown as AppContext;
    appCtx.dryRun = opts.dryRun as boolean; // Type assertion for ParseOptionValue

    const targetDir = args[0] || '.';

    appCtx.log.info.h1('Cleanup Operation')
      .label('Target:').value(targetDir)
      .label('Dry Run:').value(appCtx.dryRun ? 'Yes' : 'No')
      .label('Force:').value(opts.force ? 'Yes' : 'No')
      .emit();

    const tempFiles = ['temp1.tmp', 'temp2.tmp', 'cache.dat'];

    for (const file of tempFiles) {
      const fullPath = `${targetDir}/${file}`;
      if (appCtx.dryRun) {
        appCtx.log.info.text('Would delete: ').fileOp('DELETE', fullPath).emit();
      } else {
        appCtx.logFileOperation('DELETE', fullPath);
      }
    }

    const message = appCtx.dryRun ? `Would delete ${tempFiles.length} files` : `Deleted ${tempFiles.length} files`;

    appCtx.logStatus('success', message);
  },
});

// 5. Create root command with subcommands
const app = CliApp.Declarative.defineRootCommand({
  name: 'file-processor',
  description: 'Simple file processing CLI using BaseContext',
  arguments: [
    { name: 'command', description: 'Command to run (if not using subcommands)', required: false }
  ],
  options: {
    config: CliApp.Declarative.option.string('--config <file>', 'Configuration file'),
    quiet: CliApp.Declarative.option.boolean('--quiet', 'Suppress output'),
  },
  commands: {
    process: processCmd,
    clean: cleanCmd,
  },
  async action(ctx, args, opts) {
    const appCtx = ctx as unknown as AppContext;
    if (opts.quiet) {
      appCtx.logMgr.threshold = 'error';
    }

    if (opts.config) {
      appCtx.logStatus('info', `Using config file: ${opts.config}`);
    }

    appCtx.log.info.h1('File Processor')
      .text('Use --help to see available commands')
      .emit();

    if (args.length > 0) {
      appCtx.logStatus('info', `Command argument provided: ${args[0]}`);
    }

    appCtx.logStatus('info', 'Ready to process files');
  },
});

// 6. Run the application
if (import.meta.main) {
  await CliApp.Declarative.createApp(app, () => new AppContext() as unknown as CliApp.Ctx.IBase);
}
