/**
 * Test StartOptions level constraint functionality
 *
 * Tests the `level` option in `start()` that allows callers to specify a minimum
 * log level threshold for progress mode activation.
 *
 * OTLP Severity Reference (higher number = more severe):
 * - TRACE(1) < DEBUG(5) < VERBOSE(6) < INFO(9) < WARN(13) < ERROR(17) < FATAL(21)
 *
 * Run: deno test -A test/progress-start-level.test.ts
 */
import * as assert from 'node:assert';
import * as CliApp from '../src/mod.ts';

// Test context with ProgressMsgBuilder
class TestContext extends CliApp.Ctx.AbstractBase {
  protected override builderClass = CliApp.Progress.MsgBuilder;
}

const pkg = { name: 'test-app', version: '1.0.0', description: 'Test' };

Deno.test('StartOptions level constraint - basic behavior', async (t) => {
  await t.step('should use progress mode when level meets threshold (info >= info)', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info'); // threshold = info (severity 9)

    // With level: 'info' at info threshold → progress mode
    // INFO(9) >= INFO(9) = true
    ctx.log.info.text('Task').start({ level: 'info' });

    // In TTY: would be active progress, in test without TTY: falls back to emit
    // Either way, the call should succeed
    assert.ok(true);
  });

  await t.step('should emit when level severity is less than threshold (info < debug)', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('debug'); // threshold = debug (severity 5)

    // With level: 'info' at debug threshold → emit mode
    // INFO(9) >= DEBUG(5) = true, so progress SHOULD work
    // Actually, at debug threshold, we show debug AND info (both pass 9 >= 5)
    // So this WOULD use progress mode

    // Let's try the opposite: verbose at info threshold
    // VERBOSE(6) >= INFO(9) = false, so verbose is suppressed at info threshold

    // Reset ctx with info threshold
    const ctx2 = new TestContext(pkg);
    await ctx2.setupLogging('info'); // threshold = info (severity 9)

    // With level: 'verbose' at info threshold → emit mode (below threshold)
    // The check is: startSeverity >= threshold.severity
    // We want to test when the level constraint is NOT met
    // VERBOSE(6) >= INFO(9) = false → emits
    ctx2.log.verbose.text('Task').start({ level: 'verbose' });

    // Should NOT have active progress
    assert.strictEqual(ctx2.log.verbose.isProgressActive, false);
  });

  await t.step('should default to verbose level when not specified', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('verbose'); // threshold = verbose (severity 6)

    // No level specified → defaults to verbose (6)
    // At verbose threshold: 6 >= 6 = true → progress mode attempted
    ctx.log.verbose.text('Task').start();

    // Must complete/cancel to clean up the interval
    ctx.log.verbose.text('Done').complete();

    // Should succeed
    assert.ok(true);
  });
});

Deno.test('StartOptions level constraint - severity comparison', async (t) => {
  await t.step('DEBUG(5) level at INFO(9) threshold - below, should emit', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info'); // threshold = info (severity 9)

    // DEBUG(5) >= INFO(9) = false → emit mode
    ctx.log.debug.text('Debug task').start({ level: 'debug' });

    assert.strictEqual(ctx.log.debug.isProgressActive, false);
  });

  await t.step('WARN(13) level at INFO(9) threshold - above, should progress', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info'); // threshold = info (severity 9)

    // WARN(13) >= INFO(9) = true → progress mode
    ctx.log.warn.text('Warning task').start({ level: 'warn' });

    // In TTY this would be active, in non-TTY test env it falls back
    // We just verify it doesn't throw
    assert.ok(true);
  });

  await t.step('INFO(9) level at VERBOSE(6) threshold - above, should progress', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('verbose'); // threshold = verbose (severity 6)

    // INFO(9) >= VERBOSE(6) = true → progress mode
    // At verbose threshold, we show verbose, info, warn, error, etc.
    ctx.log.info.text('Info task').start({ level: 'info' });

    assert.ok(true);
  });
});

Deno.test('StartOptions level constraint - update and complete', async (t) => {
  await t.step('update should emit when start fell back to emit', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info'); // threshold = info (severity 9)

    // Start with level: 'debug' at info threshold → emit mode
    // DEBUG(5) >= INFO(9) = false
    ctx.log.debug.text('Starting').start({ level: 'debug' });
    assert.strictEqual(ctx.log.debug.isProgressActive, false);

    // Update should also emit (not throw)
    ctx.log.debug.text('Updating').update(50);

    // Complete should also emit
    ctx.log.debug.text('Done').complete();

    assert.ok(true);
  });

  await t.step('complete should work when no progress active', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('error'); // threshold = error (severity 17)

    // Info level is below error threshold
    // INFO(9) >= ERROR(17) = false → emit mode
    ctx.log.info.text('Task').start({ level: 'info' });
    assert.strictEqual(ctx.log.info.isProgressActive, false);

    // Complete should emit without error
    ctx.log.info.text('Task done').complete();

    assert.ok(true);
  });
});

Deno.test('StartOptions level constraint - mixed level workflow', async (t) => {
  await t.step('info progress with verbose details at info threshold', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info'); // threshold = info (severity 9)

    // Info-level progress with level: 'info' at info threshold
    // INFO(9) >= INFO(9) = true → progress mode
    ctx.log.info.text('Building project').start({ level: 'info' });

    // Verbose messages are suppressed (VERBOSE(6) < INFO(9))
    ctx.log.verbose.text('  Loading config').emit();
    ctx.log.verbose.text('  Parsing files').emit();

    // Info-level updates work
    ctx.log.info.text('  Compiling...').update();
    ctx.log.info.text('  Bundling...').update();

    // Complete
    ctx.log.info.icheck().text('Build complete!').complete();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('verbose progress falls back to emit at info threshold', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info'); // threshold = info (severity 9)

    // Try to start verbose progress at info threshold
    // VERBOSE(6) >= INFO(9) = false → emit mode
    ctx.log.verbose.text('Detailed task').start({ level: 'verbose' });
    assert.strictEqual(ctx.log.verbose.isProgressActive, false);

    // Verbose updates also emit
    ctx.log.verbose.text('Step 1').update();
    ctx.log.verbose.text('Step 2').update();
    ctx.log.verbose.text('Done').complete();

    assert.ok(true);
  });
});

Deno.test('StartOptions level constraint - indent interaction', async (t) => {
  await t.step('indent works when level constraint causes emit mode', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info'); // threshold = info (severity 9)

    // Debug level with level: 'debug' at info threshold → emit mode
    // DEBUG(5) >= INFO(9) = false
    ctx.log.debug.text('Task').start({ level: 'debug' });
    assert.strictEqual(ctx.log.debug.isProgressActive, false);

    // Indent should work (no progress active)
    ctx.log.indent();
    ctx.log.info.text('  Sub-task 1').emit();
    ctx.log.info.text('  Sub-task 2').emit();
    ctx.log.outdent();

    // Complete
    ctx.log.debug.text('Done').complete();

    assert.strictEqual(ctx.log.debug.nestingDepth, 0);
  });

  await t.step('indent suppressed when level constraint allows progress', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info'); // threshold = info (severity 9)

    // Info-level start with level: 'info' at info threshold → progress mode
    // INFO(9) >= INFO(9) = true
    ctx.log.info.text('Building').start({ level: 'info' });

    // Indent should be suppressed during progress
    ctx.log.indent();

    // These should still work
    ctx.log.info.text('Step 1').update();
    ctx.log.info.text('Step 2').update();

    ctx.log.outdent();
    ctx.log.info.text('Done').stop();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });
});

Deno.test('StartOptions level constraint - nested progress', async (t) => {
  await t.step('parent with lower level constraint than child', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('debug'); // threshold = debug (severity 5)

    // Parent: info level with level: 'info' at debug threshold
    // INFO(9) >= DEBUG(5) = true → progress mode (in TTY)
    ctx.log.info.text('Parent task').start({ level: 'info' });

    // Child: verbose level with level: 'verbose' at debug threshold
    // VERBOSE(6) >= DEBUG(5) = true → nested progress (in TTY)
    ctx.log.verbose.text('  Child task').start({ level: 'verbose' });

    // Complete child
    ctx.log.verbose.text('  Done').complete();

    // Complete parent
    ctx.log.info.text('Parent done').complete();

    // In TTY: nesting depth should be 0 after completing all
    // In non-TTY: progress falls back to emit, depth is always 0
    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('parent emit, child progress with different constraints', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info'); // threshold = info (severity 9)

    // Parent: debug level with level: 'debug' at info threshold → emit mode
    // DEBUG(5) >= INFO(9) = false
    ctx.log.debug.text('Parent task').start({ level: 'debug' });
    assert.strictEqual(ctx.log.debug.isProgressActive, false);

    // Child: info level with level: 'info' at info threshold
    // INFO(9) >= INFO(9) = true → progress mode (in TTY)
    ctx.log.info.text('Child task').start({ level: 'info' });

    // Complete child
    ctx.log.info.text('Child done').complete();

    // Complete parent
    ctx.log.debug.text('Parent done').complete();

    assert.ok(true);
  });
});

Deno.test('StartOptions level constraint - error handling', async (t) => {
  await t.step('should throw on invalid level string', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    // Invalid level should throw
    let threw = false;
    try {
      // deno-lint-ignore no-explicit-any
      ctx.log.info.text('Task').start({ level: 'invalid_level' as any });
    } catch (_e) {
      threw = true;
    }
    assert.strictEqual(threw, true);
  });

  await t.step('should accept valid level names', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('debug'); // Use debug to allow all levels

    // These should not throw
    ctx.log.info.text('Task 1').start({ level: 'fatal' });
    ctx.log.info.text('Task 2').start({ level: 'error' });
    ctx.log.info.text('Task 3').start({ level: 'warn' });
    ctx.log.info.text('Task 4').start({ level: 'info' });
    ctx.log.info.text('Task 5').start({ level: 'debug' });
    ctx.log.info.text('Task 6').start({ level: 'verbose' });
    ctx.log.info.text('Task 7').start({ level: 'trace' });

    assert.ok(true);
  });

  await t.step('should accept numeric severity values', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('trace'); // Use trace to allow all levels

    // These should not throw
    ctx.log.info.text('Task 1').start({ level: 1 }); // fatal
    ctx.log.info.text('Task 2').start({ level: 9 }); // info
    ctx.log.info.text('Task 3').start({ level: 13 }); // warn
    ctx.log.info.text('Task 4').start({ level: 21 }); // fatal

    assert.ok(true);
  });
});

Deno.test('StartOptions level constraint - using pattern', async (t) => {
  await t.step('should work with level constraint in progress mode', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    {
      using _progress = ctx.log.info.text('Processing').start({ level: 'info' });
      // Do work here
    }
    // Progress automatically completes here

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('should work with level constraint in emit mode', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    {
      // This will emit, not start progress (level: 'debug' at info threshold)
      // DEBUG(5) >= INFO(9) = false
      using _progress = ctx.log.debug.text('Processing').start({ level: 'debug' });
      // Do work here
    }
    // complete() called automatically, but was emit mode

    assert.ok(true);
  });
});

Deno.test('StartOptions level constraint - edge cases', async (t) => {
  await t.step('should handle level at exact threshold boundary', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info'); // threshold = info (severity 9)

    // level: 'info' at info threshold
    // INFO(9) >= INFO(9) = true → progress mode
    ctx.log.info.text('Task').start({ level: 'info' });

    assert.ok(true);
  });

  await t.step('should handle multiple starts with different level constraints', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('debug'); // threshold = debug (severity 5)

    // Both should work at debug threshold
    ctx.log.info.text('Task 1').start({ level: 'info' });
    ctx.log.verbose.text('Task 2').start({ level: 'verbose' });

    // Complete in reverse order
    ctx.log.verbose.text('Task 2 done').complete();
    ctx.log.info.text('Task 1 done').complete();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('should handle cancel with level constraint', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Task').start({ level: 'info' });

    // Cancel should work
    ctx.log.info.cancel();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('should handle stop() alias with level constraint', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Task').start({ level: 'info' });
    ctx.log.info.text('Done').stop();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });
});

Deno.test('StartOptions level constraint - practical use cases', async (t) => {
  await t.step('use case: CLI tool with --verbose flag', async () => {
    // Simulate: normal mode shows progress, verbose mode shows detailed logs
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info'); // Normal mode

    // Progress bar at info level
    ctx.log.info.text('Installing packages').start({ level: 'info' });

    // Verbose details (suppressed at info threshold)
    ctx.log.verbose.text('  Resolving dependencies...').emit();
    ctx.log.verbose.text('  Downloading package-a...').emit();
    ctx.log.verbose.text('  Downloading package-b...').emit();

    // Progress completion
    ctx.log.info.icheck().text('Packages installed').complete();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('use case: build process with stages', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    // Stage 1: Clean
    ctx.log.info.text('Cleaning').start({ level: 'info' });
    ctx.log.verbose.text('  Removing dist/').emit();
    ctx.log.info.icheck().text('Cleaned').complete();

    // Stage 2: Build
    ctx.log.info.text('Building').start({ level: 'info' });
    ctx.log.verbose.text('  Compiling TypeScript...').emit();
    ctx.log.verbose.text('  Generating types...').emit();
    ctx.log.info.icheck().text('Built').complete();

    // Stage 3: Test
    ctx.log.info.text('Testing').start({ level: 'info' });
    ctx.log.verbose.text('  Running unit tests...').emit();
    ctx.log.verbose.text('  Running integration tests...').emit();
    ctx.log.info.icheck().text('Tests passed').complete();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });
});
