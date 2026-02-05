import * as CliApp from '../cliapp/src/mod.ts';
import pkg from './deno.json' with { type: 'json' };

// Define your context
class RootContext extends CliApp.Ctx.Context {
  debugMode = false;
}

class ChildContext extends RootContext {
  processedFiles = 0;
}

type RootOptions = CliApp.LogOptions & { debugMode: boolean };

// Define your commands
class RootCommand extends CliApp.Command<RootContext, RootOptions, ChildContext> {
  protected override setupCommandOptions(): void {
    this.option('--debug-mode', 'Enable debug mode');
  }

  protected override subCommands = {
    process: SubCommand,
  };

  protected override execute(opts: RootOptions) {
    this.ctx.debugMode = opts.debugMode;
  }

  protected override deriveChildContext(ctx: RootContext): Promise<ChildContext> {
    return Promise.resolve(new ChildContext(ctx, { pkg: 'child' }));
  }
}

type SubOptions = { force: boolean };

class SubCommand extends CliApp.Command<ChildContext, SubOptions, ChildContext> {
  protected override setupCommandOptions(): void {
    this.description('Process files');
    this.argument('<files...>', 'Files to process');
    this.option('-f, --force', 'Force processing');
  }

  override execute(opts: SubOptions, files: CliApp.CmdArgs) {
    this.ctx.log.info.h1('Processing:').emit();
    this.ctx.log.indent();
    this.ctx.log.info.label('Force:').value(opts.force).emit();
    this.ctx.log.info.label('Files:').count(files.length).value('file').emit();
    this.ctx.log.debug.label('Debug mode:').value(this.ctx.debugMode).emit();
    this.ctx.log.outdent();
    // Process files...
    this.ctx.processedFiles = files.length;
  }
}

// // Run your application
// if (import.meta.main) {
//   const ctx = new AppContext(pkg);
//   await ctx.setupLogging();

//   const root = new RootCommand();
//   await root.init(ctx);
//   root.option('--debug-mode', 'Enable debug mode');
//   root.addLogging();

//   await run(ctx, () => root.parseAsync());
// }

if (import.meta.main) {
  const rootCtx = new RootContext(pkg);
  await rootCtx.setupLogging();

  // Instantiate and initialize root command
  const rootCmd = new RootCommand(pkg);
  await rootCmd.init(rootCtx);

  // Enhanced run with automatic logging configuration
  await CliApp.run(rootCtx, rootCmd);
}
