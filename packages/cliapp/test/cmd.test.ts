import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import { assertEquals, assertExists } from '@std/assert';
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

const pkg = { name: 'test-app', version: '1.2.3', description: 'Test description' };

describe('BaseCommand', () => {
  it('should apply metadata from params in constructor', async () => {
    class MyCommand extends CliApp.BaseCommand<TestContext, TestContext> {
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

    assertEquals(cmd.commander.name(), 'test-app');
    assertEquals(cmd.commander.version(), '1.2.3');
    assertEquals(cmd.commander.description(), 'Test description');
  });

  it('should apply aliases to subcommands but not root', async () => {
    class RootCmd extends CliApp.BaseCommand<TestContext, TestContext> {
      constructor(ctx: TestContext) {
        super(ctx, { name: 'root', aliases: ['r'], root: true });
      }
      override createContext(parent?: TestContext): TestContext {
        return (parent || this.parentContext)!;
      }
      override execute() {}
    }
    class SubCmd extends CliApp.BaseCommand<TestContext, TestContext> {
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

    assertEquals(root.commander.aliases(), []);
    assertEquals(sub.commander.aliases(), ['s']);
  });

  it('should add logging options and dry-run when requested', async () => {
    class RootCmd extends CliApp.BaseCommand<TestContext, TestContext> {
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
    const options = root.commander.options;

    assertExists(options.find((o) => o.long === '--log-level'));
    assertExists(options.find((o) => o.long === '--dry-run'));
  });

  it('should register subcommands from getSubCommands', async () => {
    class SubCmd extends CliApp.BaseCommand<TestContext, TestContext> {
      constructor(ctx?: TestContext) {
        super(ctx, { name: 'sub' });
      }
      override createContext(parent?: TestContext): TestContext {
        return (parent || this.parentContext)!;
      }
      override execute() {}
    }
    class RootCmd extends CliApp.BaseCommand<TestContext, TestContext> {
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

    assertExists(root.commander.commands.find((c) => c.name() === 'sub'));
  });

  it('should allow omitting defineOptions and hydrateContext', async () => {
    class SimpleCmd extends CliApp.BaseCommand<TestContext, TestContext> {
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
    assertExists(cmd);
  });
});
