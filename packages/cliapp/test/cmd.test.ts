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
        super(ctx, { root: true, dryRun: true });
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
