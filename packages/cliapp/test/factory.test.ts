import type * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import { assertEquals, assertExists } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import * as CliApp from '../src/mod.ts';

type M = Console.Builder;
type L = Log.Std.Logger<M>;
class TestContext extends CliApp.Ctx.AbstractBase<M, L> {
  // Use default setupLogging
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
      createContext: (ctx) => ctx,
    };

    const HelloCmd = CliApp.Cmd.create(node, { root: true });
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();

    const cmd = new HelloCmd(ctx);
    await cmd.init();

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
      createContext: (ctx) => ctx,
    };

    const TestCmd = CliApp.Cmd.create(node);
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const cmd = new TestCmd(ctx);
    await cmd.init();

    assertExists(cmd.commander.options.find((o) => o.long === '--save'));
    assertExists(cmd.commander.registeredArguments.find((a) => a.name() === 'input'));
  });

  it('should support nested subcommands (Node within Node)', async () => {
    const node: CliApp.CommandNode<TestContext> = {
      name: 'root',
      createContext: (ctx) => ctx,
      subCommands: {
        child: {
          name: 'child',
          description: 'Child command',
          createContext: (ctx) => ctx,
        },
      },
    };

    const RootCmd = CliApp.Cmd.create(node);
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const root = new RootCmd(ctx);
    await root.init();

    // deno-lint-ignore no-explicit-any
    const child = root.commander.commands.find((c: any) => c.name() === 'child');
    assertExists(child);
    assertEquals(child.description(), 'Child command');
  });

  it('should support mix of Nodes and Classes in subCommands', async () => {
    class MySubCmd extends CliApp.Cmd.AbstractBase<TestContext, TestContext> {
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
      createContext: (ctx) => ctx,
      subCommands: {
        nodeSub: {
          name: 'node-sub',
          createContext: (ctx) => ctx,
        },
        classSub: MySubCmd,
      },
    };

    const RootCmd = CliApp.Cmd.create(node);
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const root = new RootCmd(ctx);
    await root.init();

    assertExists(root.commander.commands.find((c) => c.name() === 'node-sub'));
    assertExists(root.commander.commands.find((c) => c.name() === 'class-sub'));
  });

  it('should override node metadata with CmdParams', async () => {
    const node: CliApp.CommandNode<TestContext> = {
      name: 'node-name',
      version: '1.0.0',
    };
    const ParamsCmd = CliApp.Cmd.create(node, { name: 'param-name', version: '2.0.0', root: true });
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const cmd = new ParamsCmd(ctx);
    await cmd.init();
    assertEquals(cmd.commander.name(), 'param-name');
    assertEquals(cmd.commander.version(), '2.0.0');
  });
});
