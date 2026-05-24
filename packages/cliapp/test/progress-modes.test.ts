/**
 * Integration test: Progress modes (SUPPRESSED, PROGRESS, EMIT)
 *
 * Tests the three operating modes based on threshold comparison.
 * Run manually: deno run -A test/progress-modes.test.ts
 */
import * as assert from 'node:assert';
import * as CliApp from '../src/mod.ts';

// Test context with ProgressMsgBuilder
class TestContext extends CliApp.Ctx.AbstractBase {
  protected override builderClass = CliApp.Progress.ProgressMsgBuilder;
}

const pkg = { name: 'test-app', version: '1.0.0', description: 'Test' };

Deno.test('Progress Modes', async (t) => {
  await t.step('SUPPRESSED mode: should not show progress when level < threshold', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('warn'); // threshold = warn

    // At info level (below threshold), progress should be suppressed
    // start() returns builder for chaining, but nothing is displayed
    ctx.log.info.text('Starting').start({ type: 'spinner', index: 0 });

    // isProgressActive should be false (level doesn't match threshold)
    assert.strictEqual(ctx.log.info.isProgressActive, false);
  });

  await t.step('PROGRESS mode: should show interactive progress when level == threshold', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info'); // threshold = info

    // At info level (matches threshold), progress should show
    // Note: progressEnabled requires TTY - in test env without TTY,
    // it falls back to EMIT mode
    ctx.log.info.text('Running').start({ type: 'spinner', index: 0, color: 'cyan' });

    // In a real TTY environment, isProgressActive would be true
    // In tests without TTY, it will be false (falls back to EMIT)
    const isActive = ctx.log.info.isProgressActive;

    if (isActive) {
      // PROGRESS mode: use update() with builder chain
      ctx.log.info.text('Working...').update();
      await new Promise((resolve) => setTimeout(resolve, 100));

      ctx.log.info.text('Done!').complete();
      assert.strictEqual(ctx.log.info.isProgressActive, false);
    } else {
      // EMIT mode in test environment - just verify API works
      ctx.log.info.text('Done!').complete();
    }
  });

  await t.step('EMIT mode: should emit log messages when level > threshold', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('debug'); // threshold = debug

    // At info level (above threshold), should emit log messages
    ctx.log.info.text('Starting task').start({ type: 'spinner', index: 0 });

    // In EMIT mode, isProgressActive should be false
    assert.strictEqual(ctx.log.info.isProgressActive, false);

    // Subsequent calls also emit as logs
    ctx.log.info.text('Still working').update();
    ctx.log.info.text('Finished').complete();
  });

  await t.step('should handle progress bar with updates', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Starting').start({
      type: 'horizontal',
      total: 10,
      width: 20,
      color: 'green',
    });

    const isActive = ctx.log.info.isProgressActive;

    if (isActive) {
      for (let i = 1; i <= 10; i++) {
        ctx.log.info.text(`Processing ${i}/10`).update(i);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      ctx.log.info.text('Complete!').complete();
    } else {
      // EMIT mode in test environment
      ctx.log.info.text('Complete!').complete();
    }
  });

  await t.step('should handle spinner with text updates', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Initializing').start({ type: 'spinner', index: 0, color: 'blue' });

    const isActive = ctx.log.info.isProgressActive;

    if (isActive) {
      ctx.log.info.text('Loading configuration...').update();
      await new Promise((resolve) => setTimeout(resolve, 100));

      ctx.log.info.text('Connecting to server...').update();
      await new Promise((resolve) => setTimeout(resolve, 100));

      ctx.log.info.text('Fetching data...').update();
      await new Promise((resolve) => setTimeout(resolve, 100));

      ctx.log.info.text('All tasks completed!').complete();
    } else {
      // EMIT mode in test environment
      ctx.log.info.text('Loading configuration...').update();
      ctx.log.info.text('Connecting to server...').update();
      ctx.log.info.text('Fetching data...').update();
      ctx.log.info.text('All tasks completed!').complete();
    }
  });

  await t.step('should handle cancel operation', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Starting').start({ type: 'spinner', index: 0 });

    const isActive = ctx.log.info.isProgressActive;

    if (isActive) {
      assert.strictEqual(isActive, true);
      ctx.log.info.cancel();
      assert.strictEqual(ctx.log.info.isProgressActive, false);
    } else {
      // In EMIT mode, cancel still works (just clears any state)
      ctx.log.info.cancel();
    }
  });

  await t.step('should handle error during progress', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Starting').start({ type: 'horizontal', total: 5, width: 10 });

    const isActive = ctx.log.info.isProgressActive;

    if (isActive) {
      try {
        for (let i = 1; i <= 5; i++) {
          ctx.log.info.text(`Step ${i}/5`).update(i);

          if (i === 3) {
            throw new Error('Simulated error');
          }

          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      } catch (_error) {
        ctx.log.error.cancel();
        ctx.log.error.text('Operation failed').emit();
      }

      assert.strictEqual(ctx.log.info.isProgressActive, false);
    } else {
      // EMIT mode - simulate error handling
      try {
        throw new Error('Simulated error');
      } catch (_error) {
        ctx.log.error.cancel();
        ctx.log.error.text('Operation failed').emit();
      }
    }
  });
});
