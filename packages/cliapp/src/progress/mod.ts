/**
 * Progress indicator module for @epdoc/cliapp.
 *
 * This module provides progress bars, spinners, and other progress indicators
 * for CLI applications. It integrates with @epdoc/progress to show interactive
 * progress in TTY terminals or fall back to regular log messages in non-TTY environments.
 *
 * @example
 * ```typescript
 * import * as CliApp from '@epdoc/cliapp';
 *
 * class AppContext extends CliApp.Ctx.AbstractBase {
 *   protected override builderClass = CliApp.Progress.MsgBuilder;
 * }
 *
 * // In your command:
 * async execute(): Promise<void> {
 *   // Start a spinner at info level
 *   const progress = this.log.info.start({ type: 'spinner', index: 0, color: 'cyan' });
 *
 *   await processFiles();
 *
 *   if (progress) {
 *     progress.update('Halfway done...');
 *   } else {
 *     this.log.info.update('Halfway done...');
 *   }
 *
 *   await processMoreFiles();
 *
 *   // Complete with final message
 *   this.log.info.complete('All files processed!');
 * }
 * ```
 */

export {
  createProgressBuilder,
  createStandaloneProgressEmitter,
  ProgressMsgBuilder,
  ProgressMsgBuilder as MsgBuilder,
} from './builder.ts';
export type { ProgressEmitter } from './builder.ts';
export type { ProgressState } from './types.ts';
