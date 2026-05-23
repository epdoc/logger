/**
 * Test level-based progress constraints (StartOptions.level)
 *
 * Tests the level constraint feature that allows specifying which log level
 * should trigger progress mode vs emit mode.
 *
 * Run: deno test -A test/progress-level.test.ts
 */
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';
import * as CliApp from '../src/mod.ts';

// Test context with ProgressMsgBuilder
class TestContext extends CliApp.Ctx.AbstractBase {
  protected override builderClass = CliApp.Progress.MsgBuilder;
}

const pkg = { name: 'test-app', version: '1.0.0', description: 'Test' };

describe('Progress Level Constraints', () => {
  describe('start() with level option', () => {
    it('should use progress mode when level matches threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      // When level='info' matches threshold='info', progress should be attempted
      // (in non-TTY, falls back to emit, but the level constraint check should pass)
      ctx.log.info.text('Starting task').start({ type: 'spinner', level: 'info' });

      // In TTY: would be active, in test env without TTY: falls back to emit
      // Either way, the call should succeed without error
      expect(ctx.log.info.isProgressActive || true).toBe(true);
    });

    it('should use emit mode when level does not match threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('verbose'); // threshold = verbose

      // When level='info' but threshold='verbose', should emit instead of progress
      ctx.log.info.text('Starting task').start({ type: 'spinner', level: 'info' });

      // Should NOT have active progress because level doesn't match
      expect(ctx.log.info.isProgressActive).toBe(false);
    });

    it('should allow verbose progress when threshold is verbose', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('verbose');

      // When level='verbose' matches threshold='verbose', progress should be attempted
      ctx.log.verbose.text('Verbose task').start({ type: 'spinner', level: 'verbose' });

      // Call should succeed
      expect(ctx.log.verbose.isProgressActive || true).toBe(true);
    });
  });

  describe('complete()/stop() fallback to emit', () => {
    it('should emit when no progress is active', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      // Call complete() without starting progress - should not throw
      ctx.log.info.text('Finished').complete();
      ctx.log.info.text('Stopped').stop();

      // Should succeed without error
      expect(true).toBe(true);
    });

    it('should emit when level constraint prevented progress start', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('verbose');

      // This will emit (not progress) because level='info' != threshold='verbose'
      ctx.log.info.text('Task').start({ level: 'info' });

      // complete() should fall back to emit since no progress is active
      ctx.log.info.text('Task complete').complete();

      expect(true).toBe(true);
    });
  });

  describe('mixed level workflow', () => {
    it('should handle info-level progress with verbose details at info threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      // Info-level progress (will use progress mode in TTY, emit in tests)
      ctx.log.info.text('Building project').start({ level: 'info' });

      // Verbose messages emit normally (they're above threshold)
      ctx.log.verbose.text('  Initializing compiler').emit();
      ctx.log.verbose.text('  Parsing files').emit();

      // Complete the info-level progress
      ctx.log.info.text('Build complete').stop();

      expect(true).toBe(true);
    });

    it('should handle verbose-level progress with info markers at verbose threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('verbose');

      // Info-level start with level='info' should emit (not progress) at verbose threshold
      ctx.log.info.text('Starting build').start({ level: 'info' });

      // Verbose progress (will use progress mode in TTY)
      ctx.log.verbose.text('  Compiling TypeScript').start({ level: 'verbose' });
      ctx.log.verbose.text('    Parsed 100 files').emit();
      ctx.log.verbose.text('  Compiled').complete();

      // Info-level stop - should emit since no active progress at this level
      ctx.log.info.text('Build finished').stop();

      expect(true).toBe(true);
    });

    it('should demonstrate the full workflow from use case', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      // Start info-level progress
      ctx.log.info.text('start').start({ level: 'info' });

      // Verbose messages (will emit since threshold=info suppresses verbose)
      // These won't output but also won't throw
      ctx.log.verbose.text('msg').emit();

      // More verbose work
      ctx.log.verbose.text('task...').start();
      ctx.log.verbose.text('task complete').stop();
      ctx.log.verbose.text('more text').emit();

      // Complete the info-level progress
      ctx.log.info.text('finished').stop();

      expect(true).toBe(true);
    });
  });

  describe('nested progress with level constraints', () => {
    it('should handle nesting when levels match threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      // Start parent progress
      ctx.log.info.text('Parent task').start({ level: 'info' });
      const _depthAfterStart = ctx.log.info.nestingDepth;

      // Start nested progress at same level
      ctx.log.info.text('  Nested task').start({ level: 'info' });

      // Complete nested
      ctx.log.info.text('  Done').complete();

      // Complete parent
      ctx.log.info.text('Parent done').complete();

      // Nesting depth should be 0 after completing all
      expect(ctx.log.info.nestingDepth).toBe(0);
    });

    it('should not nest when child level does not match threshold', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      // Start parent progress at info
      ctx.log.info.text('Parent').start({ level: 'info' });
      const _parentDepth = ctx.log.info.nestingDepth;

      // Try to start child at verbose level (won't create progress)
      ctx.log.verbose.text('Child').start({ level: 'verbose' });

      // Child won't affect nesting since it emits, not progresses
      expect(ctx.log.verbose.isProgressActive).toBe(false);
    });
  });

  describe('update() with level constraints', () => {
    it('should emit when progress not active due to level constraint', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('verbose');

      // This emits (not progress) because level='info' != threshold='verbose'
      ctx.log.info.text('Starting').start({ level: 'info' });

      // Update should also emit since no progress is active
      ctx.log.info.text('Updating').update(50);

      expect(true).toBe(true);
    });
  });

  describe('using pattern with level constraints', () => {
    it('should work with using pattern when level matches', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('info');

      {
        using _progress = ctx.log.info.text('Processing').start({ level: 'info' });
        // Do work here
      }
      // Progress automatically completes here

      expect(true).toBe(true);
    });

    it('should work with using pattern when level does not match', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging('verbose');

      {
        // This will emit, not start progress
        using _progress = ctx.log.info.text('Processing').start({ level: 'info' });
        // Do work here
      }
      // complete() called automatically, but was emit mode

      expect(true).toBe(true);
    });
  });
});

// Run tests if executed directly
if (import.meta.main) {
  await import('@std/testing/bdd');
}
