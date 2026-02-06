/**
 * @file Unit tests for BaseContext functionality
 */

import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import * as MsgBuilder from '@epdoc/msgbuilder';
import { assertEquals, assertExists } from '@std/assert';

type M = MsgBuilder.Console.Builder;
type L = Log.Std.Logger<M>;

// Test implementation of Context
class TestContext extends CliApp.Context<L> {
  setupLoggingCalled = false;

  constructor(pkg: CliApp.DenoPkg) {
    super(pkg);
  }

  async setupLogging() {
    this.setupLoggingCalled = true;
    this.logMgr = new Log.Mgr<M>();
    this.logMgr.msgBuilderFactory = MsgBuilder.Console.createMsgBuilder;
    this.logMgr.initLevels(Log.Std.factoryMethods);
    this.logMgr.threshold = 'info';
    this.log = await this.logMgr.getLogger<L>();
  }

  // Public method to test setupLogging
  async testSetupLogging() {
    await this.setupLogging();
  }
}

class CustomBuilder extends MsgBuilder.Console.Builder {
  testMethod(msg: string) {
    return this.text('[TEST] ').text(msg);
  }
}

type CustomLogger = Log.Std.Logger<CustomBuilder>;

class CustomTestContext extends CliApp.Context<CustomLogger> {
  constructor(pkg: CliApp.DenoPkg) {
    super(pkg);
  }

  async setupLogging() {
    this.logMgr = new Log.Mgr<CustomBuilder>();
    this.logMgr.msgBuilderFactory = (emitter) => new CustomBuilder(emitter);
    this.logMgr.initLevels(Log.Std.factoryMethods);
    this.logMgr.threshold = 'debug';
    this.log = await this.logMgr.getLogger<CustomLogger>();
  }
}

Deno.test('BaseContext - Constructor with package parameter', () => {
  const pkg = { name: 'test-app', version: '1.0.0', description: 'Test application' };
  const ctx = new TestContext(pkg);

  assertEquals(ctx.pkg.name, 'test-app');
  assertEquals(ctx.pkg.version, '1.0.0');
  assertEquals(ctx.pkg.description, 'Test application');
  assertEquals(ctx.dryRun, false);
});

Deno.test('BaseContext - Constructor without package parameter', () => {
  const ctx = new TestContext();

  assertEquals(ctx.pkg.name, 'unknown');
  assertEquals(ctx.pkg.version, '0.0.0');
  assertEquals(ctx.pkg.description, '');
  assertEquals(ctx.dryRun, false);
});

Deno.test('BaseContext - setupLogging must be implemented', async () => {
  const ctx = new TestContext();

  // setupLogging should be called by the concrete implementation
  await ctx.setupLogging();
  assertEquals(ctx.setupLoggingCalled, true);
  assertExists(ctx.log);
  assertExists(ctx.logMgr);
});

Deno.test('BaseContext - Custom builder integration', async () => {
  const ctx = new CustomTestContext();

  await ctx.setupLogging();
  assertExists(ctx.log);
  assertExists(ctx.logMgr);

  // Test that custom methods are available (TypeScript compilation test)
  // We can't easily test runtime custom methods without complex setup
  assertExists(ctx.log.info);
});

Deno.test('BaseContext - Close functionality', async () => {
  const ctx = new TestContext();
  await ctx.setupLogging();

  // Should not throw
  await ctx.close();
});

Deno.test('BaseContext - Close without logMgr', async () => {
  const ctx = new TestContext();
  // Don't call setupLogging, so logMgr is undefined

  // Should not throw even if logMgr is undefined
  await ctx.close();
});

Deno.test('BaseContext - dryRun property', () => {
  const ctx = new TestContext();

  assertEquals(ctx.dryRun, false);

  ctx.dryRun = true;
  assertEquals(ctx.dryRun, true);
});

Deno.test('BaseContext - IBaseCtx interface compliance', async () => {
  const ctx = new TestContext();
  await ctx.setupLogging();

  // Test that all required interface properties exist
  assertExists(ctx.log);
  assertExists(ctx.logMgr);
  assertExists(ctx.pkg);
  assertEquals(typeof ctx.dryRun, 'boolean');
  assertEquals(typeof ctx.close, 'function');
});

Deno.test('BaseContext - Type constraints work', () => {
  // This test mainly verifies TypeScript compilation
  // If the constraints are wrong, this won't compile

  const standardCtx = new TestContext();
  const customCtx = new CustomTestContext();

  assertExists(standardCtx);
  assertExists(customCtx);

  // Test that both implement basic interface properties
  assertExists(standardCtx.pkg);
  assertExists(customCtx.pkg);
  assertEquals(typeof standardCtx.dryRun, 'boolean');
  assertEquals(typeof customCtx.dryRun, 'boolean');
});
