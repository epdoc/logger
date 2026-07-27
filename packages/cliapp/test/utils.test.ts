import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import * as assert from 'node:assert';
import * as CliApp from '../src/mod.ts';

type M = Console.Builder;
type L = Log.Std.Logger<M>;

class TestContext extends CliApp.Ctx.AbstractBase<M, L> {
  // Use default setupLogging
}

const pkg = { name: 'test-app', version: '1.2.3', description: 'test' };

const enableAll: CliApp.LogCmdEnable = { verbose: true, debug: true, trace: true, spam: true, dryRun: true };

Deno.test('util', async (t) => {
  await t.step('configureLogging', async (t) => {
    await t.step('should set threshold from opts.logLevel', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logLevel: 'error' }, enableAll);
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'error');
    });

    await t.step('should set threshold from opts.verbose', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { verbose: true }, { verbose: true });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'verbose');
    });

    await t.step('should set threshold from opts.debug', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { debug: true }, { debug: true });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'debug');
    });

    await t.step('should set threshold from opts.trace', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { trace: true }, { trace: true });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'trace');
    });

    await t.step('should set threshold from opts.spam', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { spam: true }, { spam: true });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'spam');
    });

    await t.step('should throw an error if conflicting log options are provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      assert.throws(() => {
        CliApp.configureLogging(ctx, { logLevel: 'error', debug: true }, { debug: true });
      });
    });

    await t.step('should throw an error if conflicting log shortcut options are provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      assert.throws(() => {
        CliApp.configureLogging(ctx, { verbose: true, debug: true }, { verbose: true, debug: true });
      });
    });

    await t.step('should configure show options from opts.logShowAll', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShowAll: true }, enableAll);
    });

    await t.step('should configure show options from opts.logShow array', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['level', 'pkg'] }, enableAll);
    });

    await t.step('should handle specific logShow options', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['level'] }, enableAll);
    });

    await t.step('should handle "all" in logShow', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['all'] }, enableAll);
    });

    await t.step('should respect --no-color mapping', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { noColor: true }, enableAll);
    });

    await t.step('should prioritize explict color over noColor', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { color: true, noColor: true }, enableAll);
    });
  });

  await t.step('time display option', async (t) => {
    await t.step('should default time to true when no log-show options provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, {}, enableAll);
      assert.strictEqual(ctx.logMgr.show.time, true);
    });

    await t.step('should enable time when --log-show time is provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['time'] }, enableAll);
      assert.strictEqual(ctx.logMgr.show.time, true);
    });

    await t.step('should disable time when --log-show notime is provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['notime'] }, enableAll);
      assert.strictEqual(ctx.logMgr.show.time, false);
    });

    await t.step('should handle time in combination with other show options', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['level', 'time', 'pkg'] }, enableAll);
      assert.strictEqual(ctx.logMgr.show.time, true);
      assert.strictEqual(ctx.logMgr.show.level, true);
      assert.strictEqual(ctx.logMgr.show.pkg, true);
    });

    await t.step('should override default time:true with notime', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['level', 'notime'] }, enableAll);
      assert.strictEqual(ctx.logMgr.show.time, false);
      assert.strictEqual(ctx.logMgr.show.level, true);
    });

    await t.step('should set time to true when --log-show-all is used', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShowAll: true }, enableAll);
      assert.strictEqual(ctx.logMgr.show.time, true);
      assert.strictEqual(ctx.logMgr.show.level, true);
      assert.strictEqual(ctx.logMgr.show.pkg, true);
    });

    await t.step('should preserve time:true when other show options are set without affecting time', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['level', 'pkg'] }, enableAll);
      assert.strictEqual(ctx.logMgr.show.time, true);
      assert.strictEqual(ctx.logMgr.show.level, true);
      assert.strictEqual(ctx.logMgr.show.pkg, true);
    });

    await t.step('should handle last-wins when both time and notime are provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['time', 'notime'] }, enableAll);
      assert.strictEqual(ctx.logMgr.show.time, false);
    });

    await t.step('should handle last-wins when notime comes before time', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['notime', 'time'] }, enableAll);
      assert.strictEqual(ctx.logMgr.show.time, true);
    });

    await t.step('should preserve time:true with all option', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['all'] }, enableAll);
      assert.strictEqual(ctx.logMgr.show.time, true);
    });
  });

  await t.step('configureLogging suppression', async (t) => {
    await t.step('verbose allowed and set — threshold set', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { verbose: true }, { verbose: true });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'verbose');
    });

    await t.step('verbose suppressed — threshold unchanged', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { verbose: true }, { verbose: false });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'info');
    });

    await t.step('debug suppressed — threshold unchanged', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { debug: true }, { debug: false });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'info');
    });

    await t.step('trace suppressed — threshold unchanged', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { trace: true }, { trace: false });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'info');
    });

    await t.step('spam suppressed — threshold unchanged', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { spam: true }, { spam: false });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'info');
    });

    await t.step('dryRun suppressed — ctx.dryRun not set', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { dryRun: true }, { dryRun: false });
      assert.strictEqual(ctx.dryRun, false);
    });

    await t.step('dryRun allowed — ctx.dryRun set', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { dryRun: true }, { dryRun: true });
      assert.strictEqual(ctx.dryRun, true);
    });

    await t.step('logLevel always works regardless of enabled shortcuts', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logLevel: 'error' }, { verbose: false });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'error');
    });

    await t.step('conflict detected when both options are enabled', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      assert.throws(() => {
        CliApp.configureLogging(ctx, { verbose: true, debug: true }, { verbose: true, debug: true });
      });
    });

    await t.step('no conflict when one option is suppressed', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { verbose: true, debug: true }, { verbose: false, debug: true });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'debug');
    });
  });

  await t.step('commaList', async (t) => {
    await t.step('should split a comma-separated string into an array', () => {
      assert.deepStrictEqual(CliApp.commaList('a,b,c'), ['a', 'b', 'c']);
      assert.deepStrictEqual(CliApp.commaList('a'), ['a']);
      assert.deepStrictEqual(CliApp.commaList(''), []);
    });
  });

  await t.step('SilentError', async (t) => {
    await t.step('should have silent=true property', () => {
      const err = new CliApp.SilentError('oops');
      assert.strictEqual(err.message, 'oops');
      assert.strictEqual(err.silent, true);
    });
  });
});
