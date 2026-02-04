/**
 * SOLUTION DEMONSTRATION: Reusable FsdateCommand
 * 
 * This shows how the enhanced Command class eliminates duplication
 * by allowing the same command to work as both root and subcommand.
 */

// Enhanced fsdate command that works as both root and subcommand
export class FsdateCommand extends CliffApp.Command<Ctx.Context> {
  protected override setupCommandOptions(): void {
    this.cmd
      .description('Rename media files to include dates')
      .option('-m, --meta', 'Show extracted metadata (date, software) for each file')
      .option('--undo', 'Undo last batch of renames')
      .option('-r, --recursive', 'Process files recursively')
      .option('-p, --prefix <string>', 'Prefix for new filenames', { default: '' })
      .option('-s, --suffix <string>', 'Suffix for new filenames', { default: '' })
      .option('-f, --format <string>', 'Date format string', { default: 'yyyyMMdd_HHmmss' })
      .option('--no-descriptive', 'Do not include descriptive part in new filename')
      .option('-b, --include-basename', 'Include original basename in new filename')
      .option('--no-include-basename', 'Do not include original basename in new filename')
      .option('--rmdup', 'Remove duplicate files based on content hash')
      .option('--no-progress', 'Suppress progress bar display')
      .arguments('<files...>');
  }

  protected override setupAction(): void {
    this.cmd.action(async (opts, ...files) => {
      // Logging is automatically configured by framework for root commands
      // No need for manual CliffApp.configureLogging() call
      
      if (files.length === 0) {
        this.warn.h1(this.ctx.pkg.name).warn('No files specified').emit();
        return;
      }
      
      this.info.h1(this.ctx.pkg.name).label('Run').emit();

      if (opts.undo) {
        const undoMgr = await new Undo.Manager().init();
        await undoMgr.undo(this.ctx);
        return;
      }

      const showMeta = opts.meta;
      const renameOpts: RenameOptions = {
        files: files,
        dryRun: showMeta ? true : this.ctx.dryRun,
        prefix: opts.prefix,
        suffix: opts.suffix,
        format: opts.format || 'yyyyMMdd_HHmmss',
        descriptive: opts.descriptive,
        includeBasename: opts.includeBasename,
        rmdup: opts.rmdup,
        showMeta: showMeta,
        recursive: opts.recursive,
        progress: opts.progress,
      };

      await new Renamer(this.ctx, renameOpts).run();
    });
  }
}

// Usage Examples:

// 1. As standalone root command (fsdate main.ts):
const rootCmd = new FsdateCommand()
  .setMode(CommandMode.ROOT); // Adds logging options automatically
await rootCmd.setContext(ctx);
await rootCmd.init();

// 2. As subcommand in fs CLI:
const subCmd = new FsdateCommand()
  .setMode(CommandMode.SUBCOMMAND); // No logging options added
await subCmd.setContext(parentCtx, { _isSubcommand: true });
await subCmd.init();

// 3. Auto-detection (recommended):
const cmd = new FsdateCommand(); // Uses AUTO mode
await cmd.setContext(ctx, opts); // Auto-detects based on _isSubcommand marker

// Benefits:
// ✅ Single command class instead of duplicated RootCommand + FsdateCommand
// ✅ All options, arguments, and logic defined once
// ✅ Automatic logging option management
// ✅ Works seamlessly as both root and subcommand
// ✅ No manual CliffApp.configureLogging() calls needed
