/**
 * @example Progress indicator usage examples
 *
 * This file demonstrates how to use the ProgressMsgBuilder in CLI applications.
 */

import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';

// ============================================================================
// Example 1: Basic Progress Setup
// ============================================================================

/**
 * Simple context with progress support enabled.
 */
class AppContext extends CliApp.Ctx.AbstractBase<CliApp.Progress.MsgBuilder> {
  protected override builderClass = CliApp.Progress.MsgBuilder;
}

/**
 * Command that uses progress indicators.
 */
class ProcessCommand extends CliApp.Cmd.AbstractBase<AppContext, AppContext> {
  static override description = 'Process files with progress indicator';

  async execute(): Promise<void> {
    const files = ['file1.txt', 'file2.txt', 'file3.txt', 'file4.txt', 'file5.txt'];

    // Show determinate progress bar
    for (let i = 0; i < files.length; i++) {
      this.ctx.log.info
        .label('Processing')
        .progress(i + 1, files.length, {
          label: files[i],
          width: 30,
          showPercent: true,
          showCount: true,
        })
        .update();

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Complete with final message
    this.ctx.log.info.complete(`Processed ${files.length} files`).emit();
  }
}

// ============================================================================
// Example 2: Indeterminate Progress (Spinner)
// ============================================================================

class SpinnerCommand extends CliApp.Cmd.AbstractBase<AppContext, AppContext> {
  static override description = 'Show spinner while waiting';

  async execute(): Promise<void> {
    // Start spinner
    this.ctx.log.info.spinner({ text: 'Loading data...' }).start();

    // Simulate async work
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update spinner
    this.ctx.log.info.spinner({ text: 'Processing...' }).nextFrame().update();

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Complete
    this.ctx.log.info.complete('Done!').emit();
  }
}

// ============================================================================
// Example 3: Custom ConsoleTransport with Progress
// ============================================================================

async function setupProgressLogging(logMgr: Log.Mgr) {
  // Create console transport with progress enabled
  const consoleTransport = new Log.Transport.Console.Transport(logMgr, {
    format: 'text',
    color: true,
    progress: true, // Enable progress mode
  });

  await logMgr.addTransport(consoleTransport);

  // IMPORTANT: Progress mode only works when:
  // 1. Log level matches threshold exactly
  // 2. ConsoleTransport has progress: true
  // 3. Running in a TTY (interactive terminal)
  //
  // When threshold is 'info' and you log at info level:
  // - TTY: Shows interactive progress bar
  // - Non-TTY: Falls back to regular log messages
  // - Level > threshold: Regular logs (no progress)
  // - Level < threshold: No output

  return logMgr;
}

// ============================================================================
// Example 4: Error Handling with Progress
// ============================================================================

class SafeProcessCommand extends CliApp.Cmd.AbstractBase<AppContext, AppContext> {
  async execute(): Promise<void> {
    const items = ['a', 'b', 'c', 'd', 'e'];

    try {
      for (let i = 0; i < items.length; i++) {
        this.ctx.log.info
          .label('Processing')
          .progress(i + 1, items.length, { label: items[i] })
          .update();

        // Simulate potential failure
        if (items[i] === 'c') {
          throw new Error('Failed to process item c');
        }

        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      this.ctx.log.info.complete('All items processed').emit();
    } catch (error) {
      // Cancel progress on error
      this.ctx.log.error.cancel();
      this.ctx.log.error.text('Processing failed:').value(error.message).emit();
      throw error;
    }
  }
}

// ============================================================================
// Example 5: Progress with Elapsed Time
// ============================================================================

class TimedCommand extends CliApp.Cmd.AbstractBase<AppContext, AppContext> {
  async execute(): Promise<void> {
    // Start timer
    this.ctx.log.info.text('Starting long operation...').start();

    // Do work
    await new Promise((resolve) => setTimeout(resolve, 3500));

    // Complete shows elapsed time automatically (3.50s)
    this.ctx.log.info.complete('Operation complete!').emit();
  }
}

// ============================================================================
// Usage Notes
// ============================================================================

/**
 * THREE OPERATING MODES:
 *
 * 1. SUPPRESSED (level < threshold)
 *    - No output at all
 *    - All methods are no-ops
 *
 * 2. PROGRESS (level == threshold, TTY available, progress enabled)
 *    - .start() - Shows interactive indicator
 *    - .update() - Updates in-place
 *    - .complete() - Shows final text with elapsed time
 *    - Falls back to EMIT mode if not TTY
 *
 * 3. EMIT (level > threshold, or not TTY, or progress disabled)
 *    - .start() - Emits log message
 *    - .update() - Emits log message
 *    - .complete() - Emits final log message
 *
 * SETUP REQUIREMENTS:
 *
 * 1. Use Progress.MsgBuilder in your context:
 *    class AppContext extends CliApp.Ctx.AbstractBase<CliApp.Progress.MsgBuilder> {
 *      protected override builderClass = CliApp.Progress.MsgBuilder;
 *    }
 *
 * 2. Enable progress in ConsoleTransport:
 *    const transport = new Log.Transport.Console.Transport(logMgr, {
 *      progress: true,
 *    });
 *
 * 3. Set threshold to match the level you want progress for:
 *    logMgr.threshold = 'info';  // Progress shows at info level
 *    // or
 *    logMgr.threshold = 'debug'; // Progress shows at debug level
 */

export {
  AppContext,
  ProcessCommand,
  SafeProcessCommand,
  setupProgressLogging,
  SpinnerCommand,
  TimedCommand,
};
