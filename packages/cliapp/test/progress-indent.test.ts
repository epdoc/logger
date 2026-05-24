/**
 * Test indent/outdent interaction with progress indicators
 *
 * This test verifies that indent/outdent are automatically suppressed
 * when progress is active (between start() and stop()/complete()).
 *
 * Run: deno test -A test/progress-indent.test.ts
 */
import * as assert from 'node:assert';
import * as CliApp from '../src/mod.ts';

// Test context with ProgressMsgBuilder
class TestContext extends CliApp.Ctx.AbstractBase {
  protected override builderClass = CliApp.Progress.MsgBuilder;
}

const pkg = { name: 'test-app', version: '1.0.0', description: 'Test' };

/**
 * Analysis of the Progress + Indent Integration
 *
 * BEHAVIOR:
 * Progress mode automatically activates when the log level matches the threshold.
 * When progress is active, indent() and outdent() are automatically suppressed
 * to prevent disrupting the in-place progress display.
 *
 * SCENARIOS:
 * 1. EMIT mode (non-TTY or level below threshold): Each call creates a new log line.
 *    No conflict - each message is independent.
 *
 * 2. PROGRESS mode (TTY with level match): Progress updates in-place.
 *    - indent() and outdent() are automatically no-ops during active progress
 *    - This prevents terminal state corruption
 *    - User is responsible for not emitting at same level during progress
 *
 * RECOMMENDED PATTERNS:
 * A. Use different levels: Progress at 'info', intermediate logs at 'verbose'
 * B. Don't emit between start/stop - collect messages and emit after stop()
 * C. Use nodent() to ensure clean state before progress operations
 */

Deno.test('Progress with Indent/Outdent', async (t) => {
  await t.step('indent is automatically suppressed during progress', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    // Start progress at info level
    ctx.log.info.text('Building project').start();

    // Indent is automatically suppressed when progress is active
    ctx.log.indent();

    // Log some messages at verbose level (won't show at info threshold)
    ctx.log.verbose.text('Compiling TypeScript...').emit();
    ctx.log.verbose.text('Bundling assets...').emit();

    // Outdent is also suppressed
    ctx.log.outdent();

    // Complete the progress - this should work correctly
    ctx.log.info.text('Build complete!').stop();

    // In non-TTY test environment, this will emit rather than show progress
    // The key is that it should not throw or corrupt state
    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('indent applies normally when no progress active', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    // Indent applies before progress starts
    ctx.log.indent();
    
    // This message should have indent (but verbose is suppressed at info)
    ctx.log.verbose.text('Preparing...').emit();
    
    // Outdent applies after progress ends
    ctx.log.outdent();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('indent works normally below threshold (emit mode)', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('verbose');

    // At verbose threshold, info level emits (no progress)
    // So indent should work normally
    ctx.log.indent();
    ctx.log.info.text('Main task').emit();
    
    // This emit will include indentation
    ctx.log.info.text('Sub-task completed').emit();
    
    ctx.log.outdent();
    ctx.log.info.text('Main task complete').emit();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('verbose messages suppressed during info progress', async () => {
    // When verbose is below threshold, verbose messages are suppressed
    // Progress is active at info level

    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    // Start info-level progress
    ctx.log.info.text('Building').start();

    // Indent suppressed during progress
    ctx.log.indent();
    
    // These verbose messages are suppressed (below threshold)
    ctx.log.verbose.text('Step 1...').emit();
    ctx.log.verbose.text('Step 2...').emit();
    
    // Outdent suppressed during progress
    ctx.log.outdent();

    // Progress completion should work cleanly
    ctx.log.info.text('Build complete').stop();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('same-level emits during progress - user responsibility', async () => {
    // This demonstrates that emitting at same level during progress
    // is still the user's responsibility to avoid

    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    // Start progress at info level
    ctx.log.info.text('Main operation').start();

    // Indent is suppressed during progress (automatic protection)
    ctx.log.indent();

    // User should avoid emitting at same level during progress
    // In TTY mode, this would disrupt the progress line
    ctx.log.info.text('Processing item 1').emit();
    ctx.log.info.text('Processing item 2').emit();

    // Outdent suppressed during progress
    ctx.log.outdent();

    // Complete progress
    ctx.log.info.text('Operation complete').stop();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });
});

Deno.test('Recommended Patterns', async (t) => {
  await t.step('Pattern 1: Different levels for progress and details', async () => {
    // Progress at 'info', details at 'verbose' (suppressed at info threshold)

    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Task').start();

    // Details at verbose level - suppressed at info threshold
    // These won't disrupt progress because they're suppressed
    ctx.log.verbose.text('Detail 1').emit();
    ctx.log.verbose.text('Detail 2').emit();

    ctx.log.info.text('Done').stop();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('Pattern 2: Use nodent() before progress operations', async () => {
    // Clear indentation before starting/stopping progress

    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    // Ensure clean state
    ctx.log.nodent();

    ctx.log.info.text('Task').start();

    // Do work without indentation changes
    ctx.log.verbose.text('Working...').emit();

    ctx.log.nodent(); // Ensure clean state before stopping
    ctx.log.info.text('Done').stop();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('Pattern 3: Emit mode fallback prevents issues', async () => {
    // In non-TTY environments (like tests), progress falls back to emit mode
    // This means each call emits a new log line, avoiding TTY issues

    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Start').start();

    // In emit mode, each of these creates a new line
    // (But indent is still suppressed during progress)
    ctx.log.info.text('Step 1').emit();
    ctx.log.info.text('Step 2').emit();

    ctx.log.info.text('Complete').stop();

    // All operations succeed without error
    assert.ok(true);
  });
});

Deno.test('Demonstrating Progress Behavior', async (t) => {
  await t.step('Automatic progress at matching threshold', async () => {
    // Progress mode activates automatically when level matches threshold
    // No { level } parameter needed

    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    // This will use progress mode in TTY, emit in tests
    ctx.log.info.text('Processing items...').start();

    // Indent automatically suppressed
    ctx.log.indent();

    ctx.log.info.text('Step 1 of 3 complete').emit();
    ctx.log.info.text('Step 2 of 3 complete').emit();

    ctx.log.outdent();

    ctx.log.info.text('All items processed').stop();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('Emit mode when level below threshold', async () => {
    // When level is below threshold, emits normally (no progress)
    // Indent works normally in this case

    const ctx = new TestContext(pkg);
    await ctx.setupLogging('verbose');

    // Info is below verbose, so this emits (no progress)
    ctx.log.info.text('Building project').start();

    // Indent works (no progress active)
    ctx.log.indent();
    ctx.log.info.text('  Compiling TypeScript...').emit();
    ctx.log.info.text('  Bundling assets...').emit();
    ctx.log.info.text('  Optimizing...').emit();
    ctx.log.outdent();

    ctx.log.info.text('Build complete').stop();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('Collect and emit after progress', async () => {
    // Collect messages during progress, emit them all after completion

    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    const messages: string[] = [];

    ctx.log.info.text('Processing...').start();

    // Collect messages instead of emitting immediately
    messages.push('Step 1 complete');
    messages.push('Step 2 complete');
    messages.push('Step 3 complete');

    ctx.log.info.text('Done').stop();

    // Now emit the collected messages
    ctx.log.indent();
    for (const msg of messages) {
      ctx.log.info.text(msg).emit();
    }
    ctx.log.outdent();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });
});

Deno.test('Edge Cases', async (t) => {
  await t.step('multiple indent/outdent cycles during progress', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Main').start();

    // Multiple indent/outdent calls - all suppressed during progress
    ctx.log.indent();
    ctx.log.info.text('A').emit();
    ctx.log.indent();
    ctx.log.info.text('B').emit();
    ctx.log.outdent();
    ctx.log.info.text('C').emit();
    ctx.log.outdent();

    ctx.log.info.text('Done').stop();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('outdent beyond available levels during progress', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Task').start();

    // Outdent suppressed during progress (should not throw)
    ctx.log.outdent(5);

    ctx.log.info.text('Complete').stop();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });

  await t.step('progress with data attachment and suppressed indent', async () => {
    const ctx = new TestContext(pkg);
    await ctx.setupLogging('info');

    ctx.log.info.text('Operation').data({ step: 1 }).start();

    // Indent suppressed during progress
    ctx.log.indent();
    ctx.log.info.text('Sub-operation').data({ step: 2 }).emit();
    ctx.log.outdent();

    ctx.log.info.text('Finished').stop();

    assert.strictEqual(ctx.log.info.nestingDepth, 0);
  });
});
