/**
 * Progress indicator module for @epdoc/cliapp.
 *
 * This module provides progress bars, spinners, and other progress indicators
 * for CLI applications. It integrates with the logging system to show interactive
 * progress in TTY terminals or fall back to regular log messages in non-TTY environments.
 *
 * @example
 * ```typescript
 * import * as CliApp from '@epdoc/cliapp';
 * import { Progress } from '@epdoc/cliapp';
 *
 * class AppContext extends CliApp.Ctx.AbstractBase<Progress.MsgBuilder> {
 *   protected override builderClass = Progress.MsgBuilder;
 * }
 *
 * // In your command:
 * async execute(): Promise<void> {
 *   const files = await this.getFiles();
 *
 *   for (let i = 0; i < files.length; i++) {
 *     this.log.info
 *       .label('Processing')
 *       .progress(i + 1, files.length, { label: files[i] })
 *       .update();
 *
 *     await processFile(files[i]);
 *   }
 *
 *   this.log.info.complete('All files processed!').emit();
 * }
 * ```
 */

export { ProgressMsgBuilder, createProgressBuilder } from './builder.ts';
export { TerminalProgressLine, LoggerProgressLine } from './line.ts';
export {
  ANSI,
  DEFAULT_PROGRESS_WIDTH,
  DEFAULT_SPINNER_INTERVAL,
  PROGRESS_BAR_STYLES,
  SPINNER_FRAMES,
} from './const.ts';
export type {
  ProgressBarOpts,
  ProgressBarStyle,
  ProgressBarStyleConfig,
  ProgressLine,
  ProgressState,
  SpinnerOpts,
  SpinnerType,
  TaskProgress,
} from './types.ts';

// Convenience alias for easier usage
import { ProgressMsgBuilder } from './builder.ts';
export type MsgBuilder = ProgressMsgBuilder;
