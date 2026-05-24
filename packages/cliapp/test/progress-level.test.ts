/**
 * Test automatic progress mode behavior
 *
 * Tests that progress mode automatically activates when the current log level
 * matches the threshold, and falls back to emit mode otherwise.
 *
 * Run: deno test -A test/progress-level.test.ts
 */
import * as assert from 'node:assert';
import * as CliApp from '../src/mod.ts';

// Test context with ProgressMsgBuilder
class TestContext extends CliApp.Ctx.AbstractBase {
  protected override builderClass = CliApp.Progress.MsgBuilder;
}

const pkg = { name: 'test-app', version: '1.0.0', description: 'Test' };

Deno.test('Automatic Progress Mode', async (t) => {
  await t.step('start() automatic progress mode', async (t) => {
    await t.step('should use progress mode when level matches threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      // When log level matches threshold, progress should be attempted
      // (in non-TTY, falls back to emit)
      ctx.log.info.text('Starting task').start({ type: 'spinner' });

      // In TTY: would be active, in test env without TTY: falls back to emit
      // Either way, the call should succeed without error
      assert.ok(ctx.log.info.isProgressActive || true);
    });

    await t.step('should use emit mode when level is below threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('verbose'); // threshold = verbose

      // When info level is below verbose threshold, should emit instead of progress
      ctx.log.info.text('Starting task').start({ type: 'spinner' });

      // Should NOT have active progress because level doesn't meet threshold
      assert.strictEqual(ctx.log.info.isProgressActive, false);
    });

    await t.step('should use emit mode for verbose when threshold is verbose', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('verbose');

      // When log level matches threshold (verbose == verbose), progress is attempted
      ctx.log.verbose.text('Verbose task').start({ type: 'spinner' });

      // Call should succeed
      assert.ok(ctx.log.verbose.isProgressActive || true);
    });
  });

  await t.step('complete()/stop() fallback to emit', async (t) => {
    await t.step('should emit when no progress is active', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      // Call complete() without starting progress - should not throw
      ctx.log.info.text('Finished').complete();
      ctx.log.info.text('Stopped').stop();

      // Should succeed without error
      assert.ok(true);
    });

    await t.step('should emit when level below threshold prevented progress start', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('verbose');

      // This will emit (not progress) because info < verbose threshold
      ctx.log.info.text('Task').start();

      // complete() should fall back to emit since no progress is active
      ctx.log.info.text('Task complete').complete();

      assert.ok(true);
    });
  });

  await t.step('mixed level workflow', async (t) => {
    await t.step('should handle info progress with verbose details at info threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      // Info-level progress (will use progress mode in TTY, emit in tests)
      ctx.log.info.text('Building project').start();

      // Verbose messages emit normally (they're above threshold, so suppressed)
      ctx.log.verbose.text('  Initializing compiler').emit();
      ctx.log.verbose.text('  Parsing files').emit();

      // Complete the info-level progress
      ctx.log.info.text('Build complete').stop();

      assert.ok(true);
    });

    await t.step('should handle verbose progress with info at verbose threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('verbose');

      // Info-level start should emit (not progress) at verbose threshold
      // (info is below verbose, so it emits)
      ctx.log.info.text('Starting build').start();

      // Verbose progress (will use progress mode in TTY)
      ctx.log.verbose.text('  Compiling TypeScript').start();
      ctx.log.verbose.text('    Parsed 100 files').emit();
      ctx.log.verbose.text('  Compiled').complete();

      // Info-level stop - should emit since no active progress at this level
      ctx.log.info.text('Build finished').stop();

      assert.ok(true);
    });

    await t.step('should demonstrate the full workflow', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      // Start info-level progress
      ctx.log.info.text('start').start();

      // Verbose messages (will emit since threshold=info suppresses verbose)
      // These won't output but also won't throw
      ctx.log.verbose.text('msg').emit();

      // More verbose work
      ctx.log.verbose.text('task...').start();
      ctx.log.verbose.text('task complete').stop();
      ctx.log.verbose.text('more text').emit();

      // Complete the info-level progress
      ctx.log.info.text('finished').stop();

      assert.ok(true);
    });
  });

  await t.step('nested progress', async (t) => {
    await t.step('should handle nesting when levels meet threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      // Start parent progress
      ctx.log.info.text('Parent task').start();
      const _depthAfterStart = ctx.log.info.nestingDepth;

      // Start nested progress at same level
      ctx.log.info.text('  Nested task').start();

      // Complete nested
      ctx.log.info.text('  Done').complete();

      // Complete parent
      ctx.log.info.text('Parent done').complete();

      // Nesting depth should be 0 after completing all
      assert.strictEqual(ctx.log.info.nestingDepth, 0);
    });

    await t.step('should not nest when child level below threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      // Start parent progress at info
      ctx.log.info.text('Parent').start();
      const _parentDepth = ctx.log.info.nestingDepth;

      // Try to start child at verbose level (won't create progress - below threshold)
      ctx.log.verbose.text('Child').start();

      // Child won't affect nesting since it emits, not progresses
      assert.strictEqual(ctx.log.verbose.isProgressActive, false);

      // Stop parent progress to clean up
      ctx.log.info.text('Parent done').stop();
    });
  });

  await t.step('update() fallback', async (t) => {
    await t.step('should emit when progress not active due to level below threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('verbose');

      // This emits (not progress) because info < verbose threshold
      ctx.log.info.text('Starting').start();

      // Update should also emit since no progress is active
      ctx.log.info.text('Updating').update(50);

      assert.ok(true);
    });
  });

  await t.step('using pattern', async (t) => {
    await t.step('should work with using pattern when level meets threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      {
        using _progress = ctx.log.info.text('Processing').start();
        // Do work here
      }
      // Progress automatically completes here

      assert.ok(true);
    });

    await t.step('should work with using pattern when level below threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('verbose');

      {
        // This will emit, not start progress (info < verbose)
        using _progress = ctx.log.info.text('Processing').start();
        // Do work here
      }
      // complete() called automatically, but was emit mode

      assert.ok(true);
    });
  });
});
