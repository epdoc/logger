import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import { assertEquals, assertThrows } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import * as CliApp from '../src/mod.ts';

type M = Console.Builder;
type L = Log.Std.Logger<M>;

class TestContext extends CliApp.Context<L> {
  override async setupLogging() {
    this.logMgr = new Log.Mgr<M>();
    this.log = await this.logMgr.getLogger<L>();
  }
}

const pkg = { name: 'test-app', version: '1.2.3', description: 'test' };

describe('util', () => {
  describe('configureLogging', () => {
    it('should set threshold from opts.logLevel', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logLevel: 'error' });
      assertEquals(ctx.log.thresholdName.toLowerCase(), 'error');
    });

    it('should set threshold from opts.verbose', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { verbose: true });
      assertEquals(ctx.log.thresholdName.toLowerCase(), 'info');
    });

    it('should set threshold from opts.debug', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { debug: true });
      assertEquals(ctx.log.thresholdName.toLowerCase(), 'debug');
    });

    it('should set threshold from opts.trace', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { trace: true });
      assertEquals(ctx.log.thresholdName.toLowerCase(), 'trace');
    });

    it('should set threshold from opts.spam', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { spam: true });
      assertEquals(ctx.log.thresholdName.toLowerCase(), 'spam');
    });

    it('should throw an error if conflicting log options are provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      assertThrows(() => {
        CliApp.configureLogging(ctx, { logLevel: 'error', debug: true });
      });
    });

    it('should throw an error if conflicting log shortcut options are provided', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      assertThrows(() => {
        CliApp.configureLogging(ctx, { verbose: true, debug: true });
      });
    });

    it('should configure show options from opts.logShowAll', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShowAll: true });
    });

    it('should configure show options from opts.logShow array', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['level', 'pkg'] });
    });

    it('should handle specific logShow options', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['level'] });
      CliApp.configureLogging(ctx, { logShow: true });
    });

    it('should handle "all" in logShow', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { logShow: ['all'] });
    });

    it('should respect --no-color mapping', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { noColor: true });
    });

    it('should prioritize explict color over noColor', async () => {
      const ctx = new TestContext(pkg);
      await ctx.setupLogging();
      CliApp.configureLogging(ctx, { color: true, noColor: true });
    });
  });

  describe('commaList', () => {
    it('should split a comma-separated string into an array', () => {
      assertEquals(CliApp.commaList('a,b,c'), ['a', 'b', 'c']);
      assertEquals(CliApp.commaList('a'), ['a']);
      assertEquals(CliApp.commaList(''), []);
    });
  });

  describe('SilentError', () => {
    it('should have silent=true property', () => {
      const err = new CliApp.SilentError('oops');
      assertEquals(err.message, 'oops');
      assertEquals(err.silent, true);
    });
  });
});
