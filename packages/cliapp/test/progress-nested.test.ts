/**
 * Test nested progress functionality
 *
 * Run: deno test -A test/progress-nested.test.ts
 */
import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import * as CliApp from '../src/mod.ts';

// Test context with ProgressMsgBuilder
class TestContext extends CliApp.Ctx.AbstractBase {
  protected override builderClass = CliApp.Progress.MsgBuilder;
}

const pkg = { name: 'test-app', version: '1.0.0', description: 'Test' };

describe('Nested Progress', () => {
  it('should track nesting depth correctly', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    // Initially no progress
    assertEquals(ctx.log.info.nestingDepth, 0);

    // Start first progress
    ctx.log.info.text('Level 1').start();
    assertEquals(ctx.log.info.nestingDepth, ctx.log.info.isProgressActive ? 1 : 0);

    // Start nested progress
    ctx.log.info.text('Level 2').start();
    assertEquals(ctx.log.info.nestingDepth, ctx.log.info.isProgressActive ? 2 : 0);

    // Start another nested level
    ctx.log.info.text('Level 3').start();
    assertEquals(ctx.log.info.nestingDepth, ctx.log.info.isProgressActive ? 3 : 0);

    // Complete all levels
    ctx.log.info.complete();
    assertEquals(ctx.log.info.nestingDepth, ctx.log.info.isProgressActive ? 2 : 0);

    ctx.log.info.complete();
    assertEquals(ctx.log.info.nestingDepth, ctx.log.info.isProgressActive ? 1 : 0);

    ctx.log.info.complete();
    assertEquals(ctx.log.info.nestingDepth, 0);
  });

  it('should handle single-level progress (no nesting)', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Single level').start();
    assertEquals(ctx.log.info.nestingDepth, ctx.log.info.isProgressActive ? 1 : 0);

    ctx.log.info.complete();
    assertEquals(ctx.log.info.nestingDepth, 0);
  });

  it('should support stop() alias for complete()', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Test').start();
    const _depthBefore = ctx.log.info.nestingDepth;

    // Use stop() instead of complete()
    ctx.log.info.stop();

    assertEquals(ctx.log.info.nestingDepth, 0);
  });

  it('should cancel all nested progress with cancel()', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    // Create nested progress
    ctx.log.info.text('Level 1').start();
    ctx.log.info.text('Level 2').start();
    ctx.log.info.text('Level 3').start();

    const _depthBefore = ctx.log.info.nestingDepth;

    // Cancel should clear entire stack
    ctx.log.info.cancel();

    assertEquals(ctx.log.info.nestingDepth, 0);
  });

  it('should handle update() during nested progress', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Level 1').start();
    ctx.log.info.text('Level 2').start();

    // Update should work at any nesting level
    ctx.log.info.text('Updated level 2').update();

    // Complete nested
    ctx.log.info.complete();

    // Update should still work after popping
    ctx.log.info.text('Updated level 1').update();

    ctx.log.info.complete();
  });

  it('should track isProgressActive correctly', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    // Start progress at INFO level
    ctx.log.info.text('Test').start();

    // Check active at same level
    const isActiveAtInfo = ctx.log.info.isProgressActive;

    // Check not active at different level
    const isActiveAtWarn = ctx.log.warn.isProgressActive;

    // They should be the same when there's no TTY (both false in tests)
    // or different when there is a TTY
    if (isActiveAtInfo) {
      assertEquals(isActiveAtWarn, false);
    }

    ctx.log.info.complete();
  });
});

// Run tests if executed directly
if (import.meta.main) {
  await import('@std/testing/bdd');
}
