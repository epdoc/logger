/**
 * @file Basic CLI app using BaseContext
 * @description Demonstrates the simplified BaseContext pattern for CLI applications
 */

import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import * as CliApp from '../cliapp/src/mod.ts';
import pkg from '../cliapp/deno.json' with { type: 'json' };

// 1. Define custom msgbuilder with project-specific methods
const AppBuilder = Console.extender({
  fileOp(operation: string, path: string) {
    return this.text('📁 ').text(operation).text(' ').path(path);
  },
  
  status(type: 'success' | 'error' | 'info') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    return this.text(icons[type]).text(' ');
  }
});

// 2. Define types once per project
type MsgBuilder = InstanceType<typeof AppBuilder>;
type Logger = Log.Std.Logger<MsgBuilder>;

// 3. Extend BaseContext with your specific types
class AppContext extends CliApp.BaseContext<MsgBuilder, Logger> {
  // Add project-specific properties
  processedFiles = 0;
  
  constructor() {
    super(pkg);
    this.setupLogging();
  }

  protected setupLogging() {
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

// 4. Define commands using declarative API
const processCmd = CliApp.Declarative.defineCommand({
  name: 'process',
  description: 'Process files in a directory',
  options: {
    input: CliApp.Declarative.Option.Path('--input <dir>', 'Input directory').default('.'),
    pattern: CliApp.Declarative.Option.String('--pattern <glob>', 'File pattern').default('*.txt'),
    verbose: CliApp.Declarative.Option.Boolean('--verbose', 'Verbose output'),
  },
  async action(opts, ctx: AppContext) {
    if (opts.verbose) {
      ctx.logMgr.threshold = 'debug';
    }

    ctx.log.info.h1('File Processing')
      .label('Directory:').value(opts.input)
      .label('Pattern:').value(opts.pattern)
      .emit();

    try {
      // Simulate file processing
      const files = ['file1.txt', 'file2.txt', 'file3.txt'];
      
      for (const file of files) {
        ctx.logFileOperation('PROCESS', `${opts.input}/${file}`);
        
        if (opts.verbose) {
          ctx.log.debug.text(`Processing details for ${file}`).emit();
        }
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      ctx.logStatus('success', `Processed ${ctx.processedFiles} files successfully`);
      
    } catch (error) {
      ctx.logStatus('error', `Processing failed: ${error.message}`);
    }
  },
});

const cleanCmd = CliApp.Declarative.defineCommand({
  name: 'clean',
  description: 'Clean temporary files',
  options: {
    dryRun: CliApp.Declarative.Option.Boolean('--dry-run', 'Show what would be deleted'),
    force: CliApp.Declarative.Option.Boolean('--force', 'Force deletion without confirmation'),
  },
  async action(opts, ctx: AppContext) {
    ctx.dryRun = opts.dryRun; // Use built-in dryRun property

    ctx.log.info.h1('Cleanup Operation')
      .label('Dry Run:').value(ctx.dryRun ? 'Yes' : 'No')
      .label('Force:').value(opts.force ? 'Yes' : 'No')
      .emit();

    const tempFiles = ['temp1.tmp', 'temp2.tmp', 'cache.dat'];
    
    for (const file of tempFiles) {
      if (ctx.dryRun) {
        ctx.log.info.text('Would delete: ').fileOp('DELETE', file).emit();
      } else {
        ctx.logFileOperation('DELETE', file);
      }
    }

    const message = ctx.dryRun 
      ? `Would delete ${tempFiles.length} files`
      : `Deleted ${tempFiles.length} files`;
    
    ctx.logStatus('success', message);
  },
});

// 5. Create root command with subcommands
const app = CliApp.Declarative.defineRootCommand({
  name: 'file-processor',
  description: 'Simple file processing CLI using BaseContext',
  globalOptions: {
    config: CliApp.Declarative.Option.String('--config <file>', 'Configuration file'),
    quiet: CliApp.Declarative.Option.Boolean('--quiet', 'Suppress output'),
  },
  subcommands: [processCmd, cleanCmd],
  async action(opts, ctx: AppContext) {
    if (opts.quiet) {
      ctx.logMgr.threshold = 'error';
    }

    if (opts.config) {
      ctx.logStatus('info', `Using config file: ${opts.config}`);
    }

    ctx.log.info.h1('File Processor')
      .text('Use --help to see available commands')
      .emit();
    
    ctx.logStatus('info', 'Ready to process files');
  },
});

// 6. Run the application
if (import.meta.main) {
  await CliApp.Declarative.createApp(app, () => new AppContext());
}
