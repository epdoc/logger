import * as assert from 'node:assert';
import * as CliApp from '../src/mod.ts';

type M = CliApp.Ctx.MsgBuilder;
type L = CliApp.Ctx.Logger;

class TestContext extends CliApp.Ctx.AbstractBase<M, L> {
}

const pkg = { name: 'test-app', version: '1.2.3', description: 'Test description' };

Deno.test('BaseCommand', async (t) => {
  await t.step('should apply metadata from params in constructor', async () => {
    class MyCommand extends CliApp.Cmd.AbstractBase<TestContext, TestContext> {
      constructor(ctx: TestContext) {
        super(ctx, { ...pkg, root: true });
      }
      override createContext(parent?: TestContext): TestContext {
        return (parent || this.parentContext)!;
      }
      override execute() {}
    }

    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const cmd = new MyCommand(ctx);
    await cmd.init();

    assert.strictEqual(cmd.commander.name(), 'test-app');
    assert.strictEqual(cmd.commander.version(), '1.2.3');
    assert.strictEqual(cmd.commander.description(), 'Test description');
  });

  await t.step('should apply aliases to subcommands but not root', async () => {
    class RootCmd extends CliApp.Cmd.AbstractBase<TestContext, TestContext> {
      constructor(ctx: TestContext) {
        super(ctx, { name: 'root', aliases: ['r'], root: true });
      }
      override createContext(parent?: TestContext): TestContext {
        return (parent || this.parentContext)!;
      }
      override execute() {}
    }
    class SubCmd extends CliApp.Cmd.AbstractBase<TestContext, TestContext> {
      constructor(ctx: TestContext) {
        super(ctx, { name: 'sub', aliases: ['s'] });
      }
      override createContext(parent?: TestContext): TestContext {
        return (parent || this.parentContext)!;
      }
      override execute() {}
    }

    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const root = new RootCmd(ctx);
    const sub = new SubCmd(ctx);
    await root.init();
    await sub.init();

    assert.deepStrictEqual(root.commander.aliases(), []);
    assert.deepStrictEqual(sub.commander.aliases(), ['s']);
  });

  await t.step('should add logging options and dry-run when requested', async () => {
    class RootCmd extends CliApp.Cmd.AbstractBase<TestContext, TestContext> {
      constructor(ctx: TestContext) {
        super(ctx, { root: { dryRun: true } });
      }
      override createContext(parent?: TestContext): TestContext {
        return (parent || this.parentContext)!;
      }
      override execute() {}
    }

    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const root = new RootCmd(ctx);
    await root.init();
    const options = root.commander.options;

    assert.ok(options.find((o) => o.long === '--log-level'));
    assert.ok(options.find((o) => o.long === '--dry-run'));
  });

  await t.step('should register subcommands from getSubCommands', async () => {
    class SubCmd extends CliApp.Cmd.AbstractBase<TestContext, TestContext> {
      constructor(ctx?: TestContext) {
        super(ctx, { name: 'sub' });
      }
      override createContext(parent?: TestContext): TestContext {
        return (parent || this.parentContext)!;
      }
      override execute() {}
    }
    class RootCmd extends CliApp.Cmd.AbstractBase<TestContext, TestContext> {
      constructor(ctx: TestContext) {
        super(ctx, { name: 'root' });
      }
      override createContext(parent?: TestContext): TestContext {
        return (parent || this.parentContext)!;
      }
      protected override getSubCommands() {
        return [new SubCmd()];
      }
      override execute() {}
    }

    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const root = new RootCmd(ctx);
    await root.init();

    assert.ok(root.commander.commands.find((c) => c.name() === 'sub'));
  });

  await t.step('should allow omitting defineOptions and hydrateContext', async () => {
    class SimpleCmd extends CliApp.Cmd.AbstractBase<TestContext, TestContext> {
      constructor(ctx: TestContext) {
        super(ctx, { name: 'simple' });
      }
      override createContext(parent?: TestContext): TestContext {
        return (parent || this.parentContext)!;
      }
      override execute() {}
    }

    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const cmd = new SimpleCmd(ctx);
    await cmd.init();
    assert.ok(cmd);
  });
});

// ========================================
// Part A: logOptions getter
// ========================================
Deno.test('logOptions', async (t) => {
  class TestRoot extends CliApp.Cmd.AbstractBase<TestContext, TestContext> {
    constructor(ctx: TestContext, params: CliApp.CmdParams) {
      super(ctx, params);
    }
    override createContext(parent?: TestContext): TestContext {
      return (parent || this.parentContext)!;
    }
    override execute() {}
  }

  const ctx = new TestContext(pkg);
  await ctx.setupLogging();

  await t.step('root: true — all enabled, dryRun false', () => {
    const cmd = new TestRoot(ctx, { root: true });
    assert.deepStrictEqual(cmd.logOptions, { verbose: true, debug: true, trace: true, spam: true, dryRun: false });
  });

  await t.step('root: true with dryRun: true — old-style backward compat', () => {
    const cmd = new TestRoot(ctx, { root: true, dryRun: true });
    assert.deepStrictEqual(cmd.logOptions, { verbose: true, debug: true, trace: true, spam: true, dryRun: true });
  });

  await t.step('root: { trace: false } — single flag suppressed', () => {
    const cmd = new TestRoot(ctx, { root: { trace: false } });
    assert.deepStrictEqual(cmd.logOptions, { verbose: true, debug: true, trace: false, spam: true, dryRun: false });
  });

  await t.step('root: { verbose: false, spam: false } — multiple suppressed', () => {
    const cmd = new TestRoot(ctx, { root: { verbose: false, spam: false } });
    assert.deepStrictEqual(cmd.logOptions, { verbose: false, debug: true, trace: true, spam: false, dryRun: false });
  });

  await t.step('root: { dryRun: true } — enable dryRun via object', () => {
    const cmd = new TestRoot(ctx, { root: { dryRun: true } });
    assert.deepStrictEqual(cmd.logOptions, { verbose: true, debug: true, trace: true, spam: true, dryRun: true });
  });

  await t.step('root: { dryRun: true } with deprecated dryRun: false — object wins', () => {
    const cmd = new TestRoot(ctx, { root: { dryRun: true }, dryRun: false });
    assert.deepStrictEqual(cmd.logOptions, { verbose: true, debug: true, trace: true, spam: true, dryRun: true });
  });

  await t.step('root: {} — empty object, all defaults', () => {
    const cmd = new TestRoot(ctx, { root: {} });
    assert.deepStrictEqual(cmd.logOptions, { verbose: true, debug: true, trace: true, spam: true, dryRun: false });
  });

  await t.step('root: false — not a root command', () => {
    const cmd = new TestRoot(ctx, { root: false });
    assert.strictEqual(cmd.logOptions, undefined);
  });

  await t.step('no root param — subcommand', () => {
    const cmd = new TestRoot(ctx, { name: 'sub' });
    assert.strictEqual(cmd.logOptions, undefined);
  });

  await t.step('all flags explicitly disabled', () => {
    const cmd = new TestRoot(ctx, { root: { verbose: false, debug: false, trace: false, spam: false, dryRun: false } });
    assert.deepStrictEqual(cmd.logOptions, { verbose: false, debug: false, trace: false, spam: false, dryRun: false });
  });
});

// ========================================
// Part B: Conditional option registration
// ========================================
Deno.test('Option registration suppression', async (t) => {
  class TestRoot extends CliApp.Cmd.AbstractBase<TestContext, TestContext> {
    constructor(ctx: TestContext, params: CliApp.CmdParams) {
      super(ctx, params);
    }
    override createContext(parent?: TestContext): TestContext {
      return (parent || this.parentContext)!;
    }
    override execute() {}
  }

  const ctx = new TestContext(pkg);
  await ctx.setupLogging();

  const hasOpt = (cmd: TestRoot, long: string) => cmd.commander.options.some((o) => o.long === long);
  const hasShort = (cmd: TestRoot, short: string) => cmd.commander.options.some((o) => o.short === short);

  await t.step('root: true — all default options present', async () => {
    const cmd = new TestRoot(ctx, { root: true });
    await cmd.init();
    assert.ok(hasOpt(cmd, '--log-level'));
    assert.ok(hasOpt(cmd, '--verbose'));
    assert.ok(hasOpt(cmd, '--debug'));
    assert.ok(hasOpt(cmd, '--trace'));
    assert.ok(hasOpt(cmd, '--spam'));
    assert.ok(hasOpt(cmd, '--log-show'));
    assert.ok(hasOpt(cmd, '--log-show-all'));
    assert.ok(hasOpt(cmd, '--no-color'));
    assert.ok(!hasOpt(cmd, '--dry-run'));
  });

  await t.step('suppress --verbose', async () => {
    const cmd = new TestRoot(ctx, { root: { verbose: false } });
    await cmd.init();
    assert.ok(!hasOpt(cmd, '--verbose'));
    assert.ok(hasOpt(cmd, '--debug'));
  });

  await t.step('suppress -D/--debug', async () => {
    const cmd = new TestRoot(ctx, { root: { debug: false } });
    await cmd.init();
    assert.ok(!hasOpt(cmd, '--debug'));
    assert.ok(!hasShort(cmd, '-D'));
    assert.ok(hasOpt(cmd, '--verbose'));
  });

  await t.step('suppress -T/--trace', async () => {
    const cmd = new TestRoot(ctx, { root: { trace: false } });
    await cmd.init();
    assert.ok(!hasOpt(cmd, '--trace'));
    assert.ok(!hasShort(cmd, '-T'));
  });

  await t.step('suppress -S/--spam', async () => {
    const cmd = new TestRoot(ctx, { root: { spam: false } });
    await cmd.init();
    assert.ok(!hasOpt(cmd, '--spam'));
    assert.ok(!hasShort(cmd, '-S'));
  });

  await t.step('dry-run NOT registered with root: true', async () => {
    const cmd = new TestRoot(ctx, { root: true });
    await cmd.init();
    assert.ok(!hasOpt(cmd, '--dry-run'));
  });

  await t.step('dry-run registered with root: { dryRun: true }', async () => {
    const cmd = new TestRoot(ctx, { root: { dryRun: true } });
    await cmd.init();
    assert.ok(hasOpt(cmd, '--dry-run'));
  });

  await t.step('never-suppressible options always present even when all shortcuts disabled', async () => {
    const cmd = new TestRoot(ctx, { root: { verbose: false, debug: false, trace: false, spam: false } });
    await cmd.init();
    assert.ok(hasOpt(cmd, '--log-level'));
    assert.ok(hasOpt(cmd, '--log-show'));
    assert.ok(hasOpt(cmd, '--log-show-all'));
    assert.ok(hasOpt(cmd, '--no-color'));
    assert.ok(!hasOpt(cmd, '--verbose'));
    assert.ok(!hasOpt(cmd, '--debug'));
    assert.ok(!hasOpt(cmd, '--trace'));
    assert.ok(!hasOpt(cmd, '--spam'));
  });
});

// ========================================
// Part D: End-to-end smoke tests
// ========================================
Deno.test('Logging option suppression e2e', async (t) => {
  class TestRoot extends CliApp.Cmd.AbstractBase<TestContext, TestContext> {
    constructor(ctx: TestContext, params: CliApp.CmdParams) {
      super(ctx, params);
    }
    override createContext(parent?: TestContext): TestContext {
      return (parent || this.parentContext)!;
    }
    override execute() {}
  }

  const ctx = new TestContext(pkg);
  await ctx.setupLogging();

  await t.step('parsing --trace fails when trace is suppressed', async () => {
    const cmd = new TestRoot(ctx, { root: { trace: false } });
    await cmd.init();
    cmd.commander.exitOverride();
    assert.throws(() => {
      cmd.commander.parse(['node', 'test', '--trace']);
    });
  });

  await t.step('parsing --trace succeeds when trace is enabled', async () => {
    const cmd = new TestRoot(ctx, { root: true });
    await cmd.init();
    cmd.commander.parse(['node', 'test', '--trace']);
    const opts = cmd.commander.opts();
    assert.strictEqual(opts.trace, true);
  });

  await t.step('parsing --dry-run fails when not enabled', async () => {
    const cmd = new TestRoot(ctx, { root: true });
    await cmd.init();
    cmd.commander.exitOverride();
    assert.throws(() => {
      cmd.commander.parse(['node', 'test', '--dry-run']);
    });
  });

  await t.step('parsing --verbose succeeds when verbose is enabled', async () => {
    const cmd = new TestRoot(ctx, { root: true });
    await cmd.init();
    cmd.commander.parse(['node', 'test', '--verbose']);
    const opts = cmd.commander.opts();
    assert.strictEqual(opts.verbose, true);
  });

  await t.step('parsing --spam fails when spam is suppressed', async () => {
    const cmd = new TestRoot(ctx, { root: { spam: false } });
    await cmd.init();
    cmd.commander.exitOverride();
    assert.throws(() => {
      cmd.commander.parse(['node', 'test', '-S']);
    });
  });

  await t.step('parsing --debug succeeds when debug is enabled', async () => {
    const cmd = new TestRoot(ctx, { root: true });
    await cmd.init();
    cmd.commander.parse(['node', 'test', '-D']);
    const opts = cmd.commander.opts();
    assert.strictEqual(opts.debug, true);
  });

  await t.step('parsing -n/--dry-run succeeds when dryRun is enabled', async () => {
    const cmd = new TestRoot(ctx, { root: { dryRun: true } });
    await cmd.init();
    await cmd.commander.parseAsync(['node', 'test', '-n']);
    // preAction hook runs configureLogging which sets ctx.dryRun
    assert.strictEqual(ctx.dryRun, true);
  });
});
