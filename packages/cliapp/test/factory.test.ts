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

const pkg = { name: 'test-app', version: '1.2.3', description: 'test' };

describe('createCommand factory', () => {
  it('should create a command class from a node', async () => {
    const node: CliApp.CommandNode<TestContext> = {
      name: 'hello',
      description: 'Say hello',
      version: '1.0.0',
      action: (ctx) => {
        ctx.log.info.text('Hello').emit();
      },
      refineContext: (ctx) => ctx,
    };

    const HelloCmd = CliApp.createCommand(node, true);
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();

    const cmd = new HelloCmd(ctx);

    assertEquals(cmd.commander.name(), 'hello');
    assertEquals(cmd.commander.description(), 'Say hello');
    assertEquals(cmd.commander.version(), '1.0.0');
  });

  it('should handle options and arguments in node', async () => {
    const node: CliApp.CommandNode<TestContext> = {
      name: 'test',
      arguments: ['<input>'],
      options: {
        '--save': 'Save result',
      },
      refineContext: (ctx) => ctx,
    };

    const TestCmd = CliApp.createCommand(node);
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const cmd = new TestCmd(ctx);

    assertExists(cmd.commander.options.find((o) => o.long === '--save'));
    assertExists(cmd.commander.registeredArguments.find((a) => a.name() === 'input'));
  });

  it('should support nested subcommands (Node within Node)', async () => {
    const node: CliApp.CommandNode<TestContext> = {
      name: 'root',
      refineContext: (ctx) => ctx,
      subCommands: {
        child: {
          name: 'child',
          description: 'Child command',
          refineContext: (ctx) => ctx,
        },
      },
    };

    const RootCmd = CliApp.createCommand(node);
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const root = new RootCmd(ctx);

    // deno-lint-ignore no-explicit-any
    const child = root.commander.commands.find((c: any) => c.name() === 'child');
    assertExists(child);
    assertEquals(child.description(), 'Child command');
  });

  it('should support mix of Nodes and Classes in subCommands', async () => {
    class MySubCmd extends CliApp.BaseCommand<TestContext, TestContext> {
      constructor(ctx?: TestContext) {
        super(ctx, { name: 'class-sub' });
      }
      override createContext(parent?: TestContext): TestContext {
        return (parent || this.parentContext)!;
      }
      override execute() {}
    }

    const node: CliApp.CommandNode<TestContext> = {
      name: 'root',
      refineContext: (ctx) => ctx,
      subCommands: {
        nodeSub: {
          name: 'node-sub',
          refineContext: (ctx) => ctx,
        },
        classSub: MySubCmd,
      },
    };

    const RootCmd = CliApp.createCommand(node);
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const root = new RootCmd(ctx);

    assertExists(root.commander.commands.find((c) => c.name() === 'node-sub'));
    assertExists(root.commander.commands.find((c) => c.name() === 'class-sub'));
  });
});
