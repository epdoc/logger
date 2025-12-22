/**
 * @file Simple CLI app example
 * @description Demonstrates the simplest method to build a complete CLI app with custom commands
 */

import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

// 1. Custom message builder with one useful method
const AppBuilder = Console.extender({
  fileInfo(name: string, size: number, type: 'file' | 'dir') {
    const icon = type === 'dir' ? '📁' : '📄';
    return this.text(icon).text(' ').text(name).text(' ').count(size).text('byte');
  },
});

type MsgBuilder = InstanceType<typeof AppBuilder>;
type AppLogger = Log.Std.Logger<MsgBuilder>;

// 2. App class that performs all the actual work
class App {
  constructor(private ctx: AppContext) {}

  async listFiles(path: string, showHidden: boolean) {
    this.ctx.log.info.h1('Listing Files').label('Path:').path(path).emit();

    try {
      const entries = [];
      for await (const entry of Deno.readDir(path)) {
        if (!showHidden && entry.name.startsWith('.')) continue;

        const stat = await Deno.stat(`${path}/${entry.name}`);
        entries.push({ name: entry.name, size: stat.size, isDirectory: entry.isDirectory });
      }

      entries.forEach((entry) => {
        this.ctx.log.info.fileInfo(
          entry.name,
          entry.size,
          entry.isDirectory ? 'dir' : 'file',
        ).emit();
      });

      this.ctx.log.info.success('Found').count(entries.length).success('item').emit();
    } catch (error) {
      this.ctx.log.error.error('Failed to list files:').err(error).emit();
    }
  }

  async diskUsage(path: string, summarize: boolean) {
    this.ctx.log.info.h1('Disk Usage').label('Path:').path(path).emit();

    try {
      let totalSize = 0;
      const sizes: Array<{ name: string; size: number }> = [];

      for await (const entry of Deno.readDir(path)) {
        const fullPath = `${path}/${entry.name}`;
        const stat = await Deno.stat(fullPath);

        if (entry.isDirectory && !summarize) {
          // For directories, just show the directory entry
          sizes.push({ name: entry.name, size: stat.size });
        } else {
          sizes.push({ name: entry.name, size: stat.size });
        }
        totalSize += stat.size;
      }

      if (!summarize) {
        sizes.forEach((item) => {
          this.ctx.log.info.fileInfo(item.name, item.size, 'file').emit();
        });
      }

      this.ctx.log.info.text('Total: ').fileInfo('', totalSize, 'file').emit();
    } catch (error) {
      this.ctx.log.error.error('Failed to calculate disk usage:').err(error).emit();
    }
  }
}

// 3. Context with App instance attached
class AppContext implements CliApp.ICtx<MsgBuilder, AppLogger> {
  log: AppLogger;
  logMgr: Log.Mgr<InstanceType<typeof AppBuilder>>;
  dryRun = false;
  pkg = {
    name: 'file-tools',
    version: '1.0.0',
    description: 'Simple file system tools',
  };

  // App instance attached to context
  app: App;

  constructor() {
    this.logMgr = Log.createLogManager(AppBuilder, {
      threshold: 'info',
      showLevel: true,
    });
    this.log = this.logMgr.getLogger<AppLogger>();
    this.app = new App(this); // App has access to full context
  }

  async close() {
    await this.logMgr.close();
  }
}

// 4. Define commands that delegate to App methods
const lsCmd = CliApp.Declarative.defineCommand({
  name: 'ls',
  description: 'List directory contents',
  options: {
    path: CliApp.Declarative.option.path('--path <dir>', 'Directory to list').default('.'),
    all: CliApp.Declarative.option.boolean('--all', 'Show hidden files'),
  },
  async action(opts, ctx) {
    await ctx.app.listFiles(opts.path, opts.all);
  },
});

const duCmd = CliApp.Declarative.defineCommand({
  name: 'du',
  description: 'Show disk usage',
  options: {
    path: CliApp.Declarative.option.path('--path <dir>', 'Directory to analyze').default('.'),
    summarize: CliApp.Declarative.option.boolean('--summarize', 'Show only total'),
  },
  async action(opts, ctx) {
    await ctx.app.diskUsage(opts.path, opts.summarize);
  },
});

// 5. Root command with subcommands
const rootApp = CliApp.Declarative.defineRootCommand({
  name: 'file-tools',
  description: 'Simple file system utilities',
  globalOptions: {
    verbose: CliApp.Declarative.option.boolean('--verbose', 'Enable verbose output'),
  },
  subcommands: [lsCmd, duCmd],
  async action(opts, ctx) {
    if (opts.verbose) {
      ctx.logMgr.threshold = 'debug';
      ctx.log.debug.text('Verbose mode enabled').emit();
    }

    ctx.log.info.h1('File Tools').text('Use --help to see available commands').emit();
  },
});

// 6. Run the application
if (import.meta.main) {
  await CliApp.Declarative.createApp(rootApp, () => new AppContext());
}
