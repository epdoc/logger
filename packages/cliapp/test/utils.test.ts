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

Deno.test('util', async (t) => {
  await t.step('configureLogging', async (t) => {
    await t.step('should set threshold from opts.logLevel', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logLevel: 'error' });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'error');
    });

    await t.step('should set threshold from opts.verbose', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { verbose: true });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'info');
    });

    await t.step('should set threshold from opts.debug', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { debug: true });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'debug');
    });

    await t.step('should set threshold from opts.trace', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { trace: true });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'trace');
    });

    await t.step('should set threshold from opts.spam', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { spam: true });
      assert.strictEqual(ctx.logMgr.threshold.name.toLowerCase(), 'spam');
    });

    await t.step('should throw an error if conflicting log options are provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      assert.throws(() => {
        CliApp.configureLogging(ctx, { logLevel: 'error', debug: true });
      });
    });

    await t.step('should throw an error if conflicting log shortcut options are provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      assert.throws(() => {
        CliApp.configureLogging(ctx, { verbose: true, debug: true });
      });
    });

    await t.step('should configure show options from opts.logShowAll', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShowAll: true });
    });

    await t.step('should configure show options from opts.logShow array', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['level', 'pkg'] });
    });

    await t.step('should handle specific logShow options', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['level'] });
    });

    await t.step('should handle "all" in logShow', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['all'] });
    });

    await t.step('should respect --no-color mapping', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { noColor: true });
    });

    await t.step('should prioritize explict color over noColor', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { color: true, noColor: true });
    });
  });

  await t.step('time display option', async (t) => {
    await t.step('should default time to true when no log-show options provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, {});
      assert.strictEqual(ctx.logMgr.show.time, true);
    });

    await t.step('should enable time when --log-show time is provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['time'] });
      assert.strictEqual(ctx.logMgr.show.time, true);
    });

    await t.step('should disable time when --log-show notime is provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['notime'] });
      assert.strictEqual(ctx.logMgr.show.time, false);
    });

    await t.step('should handle time in combination with other show options', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['level', 'time', 'pkg'] });
      assert.strictEqual(ctx.logMgr.show.time, true);
      assert.strictEqual(ctx.logMgr.show.level, true);
      assert.strictEqual(ctx.logMgr.show.pkg, true);
    });

    await t.step('should override default time:true with notime', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['level', 'notime'] });
      assert.strictEqual(ctx.logMgr.show.time, false);
      assert.strictEqual(ctx.logMgr.show.level, true);
    });

    await t.step('should set time to true when --log-show-all is used', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShowAll: true });
      assert.strictEqual(ctx.logMgr.show.time, true);
      assert.strictEqual(ctx.logMgr.show.level, true);
      assert.strictEqual(ctx.logMgr.show.pkg, true);
    });

    await t.step('should preserve time:true when other show options are set without affecting time', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['level', 'pkg'] });
      assert.strictEqual(ctx.logMgr.show.time, true);
      assert.strictEqual(ctx.logMgr.show.level, true);
      assert.strictEqual(ctx.logMgr.show.pkg, true);
    });

    await t.step('should handle last-wins when both time and notime are provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['time', 'notime'] });
      assert.strictEqual(ctx.logMgr.show.time, false);
    });

    await t.step('should handle last-wins when notime comes before time', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['notime', 'time'] });
      assert.strictEqual(ctx.logMgr.show.time, true);
    });

    await t.step('should preserve time:true with all option', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['all'] });
      assert.strictEqual(ctx.logMgr.show.time, true);
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
