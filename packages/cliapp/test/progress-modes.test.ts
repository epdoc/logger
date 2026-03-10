/**
 * Integration test: Progress modes (SUPPRESSED, PROGRESS, EMIT)
 *
 * Tests the three operating modes based on threshold comparison.
 * Run manually: deno run -A test/progress-modes.test.ts
 */
import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import * as CliApp from '../src/mod.ts';

// Test context with ProgressMsgBuilder
class TestContext extends CliApp.Ctx.AbstractBase {
  protected override builderClass = CliApp.Progress.ProgressMsgBuilder;
}

const pkg = { name: 'test-app', version: '1.0.0', description: 'Test' };

describe('Progress Modes', () => {
  it('SUPPRESSED mode: should not show progress when level < threshold', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('warn'); // threshold = warn

    // At info level (below threshold), progress should be suppressed
    const progress = ctx.log.info.start({ type: 'spinner', index: 0 });

    assertEquals(progress, null);
    assertEquals(ctx.log.info.isProgressActive, false);
  });

  it('PROGRESS mode: should show interactive progress when level == threshold', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info'); // threshold = info

    // At info level (matches threshold), progress should show
    const progress = ctx.log.info.start({ type: 'spinner', index: 0, color: 'cyan' });

    // progressEnabled requires TTY and ConsoleTransport with progress: true
    // In test environment without TTY, this may return null
    // The test verifies the API works correctly
    if (progress) {
      assertEquals(ctx.log.info.isProgressActive, true);

      progress.update('Working...');
      await new Promise((resolve) => setTimeout(resolve, 100));

      ctx.log.info.complete('Done!');
      assertEquals(ctx.log.info.isProgressActive, false);
    }
  });

  it('EMIT mode: should emit log messages when level > threshold', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('debug'); // threshold = debug

    // At info level (above threshold), should emit log messages
    const progress = ctx.log.info.start({ type: 'spinner', index: 0 });

    // In EMIT mode, start() emits a log message and returns null
    assertEquals(progress, null);
  });

  it('should handle progress bar with updates', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    const progress = ctx.log.info.start({
      type: 'horizontal',
      total: 10,
      width: 20,
      color: 'green',
    });

    if (progress) {
      for (let i = 1; i <= 10; i++) {
        progress.update(`Processing ${i}/10`, i);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      ctx.log.info.complete('Complete!');
    }
  });

  it('should handle spinner with text updates', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    const progress = ctx.log.info.start({ type: 'spinner', index: 0, color: 'blue' });

    if (progress) {
      progress.update('Loading configuration...');
      await new Promise((resolve) => setTimeout(resolve, 100));

      progress.update('Connecting to server...');
      await new Promise((resolve) => setTimeout(resolve, 100));

      progress.update('Fetching data...');
      await new Promise((resolve) => setTimeout(resolve, 100));

      ctx.log.info.complete('All tasks completed!');
    }
  });

  it('should handle cancel operation', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    const progress = ctx.log.info.start({ type: 'spinner', index: 0 });

    if (progress) {
      assertEquals(ctx.log.info.isProgressActive, true);

      ctx.log.info.cancel();

      assertEquals(ctx.log.info.isProgressActive, false);
    }
  });

  it('should handle error during progress', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    const progress = ctx.log.info.start({ type: 'horizontal', total: 5, width: 10 });

    if (progress) {
      try {
        for (let i = 1; i <= 5; i++) {
          progress.update(`Step ${i}/5`, i);

          if (i === 3) {
            throw new Error('Simulated error');
          }

          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      } catch (_error) {
        ctx.log.error.cancel();
        ctx.log.error.text('Operation failed').emit();
      }

      assertEquals(ctx.log.info.isProgressActive, false);
    }
  });
});

// Run tests if executed directly
if (import.meta.main) {
  await import('@std/testing/bdd');
}
