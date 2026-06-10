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

Deno.test('createCommand factory', async (t) => {
  await t.step('should create a command class from a node', async () => {
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

    assert.strictEqual(cmd.commander.name(), 'hello');
    assert.strictEqual(cmd.commander.description(), 'Say hello');
    assert.strictEqual(cmd.commander.version(), '1.0.0');
  });

  await t.step('should handle options and arguments in node', async () => {
    const node: CliApp.CommandNode<TestContext> = {
      name: 'test',
      arguments: ['<input>'],
      options: [{ name: 'save', description: 'Save result' }],
      createContext: (ctx) => ctx,
    };

    const TestCmd = CliApp.Cmd.create(node);
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const cmd = new TestCmd(ctx);
    await cmd.init();

    assert.ok(cmd.commander.options.find((o) => o.long === '--save'));
    assert.ok(cmd.commander.registeredArguments.find((a) => a.name() === 'input'));
  });

  await t.step('should support nested subcommands (Node within Node)', async () => {
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
    assert.ok(child);
    assert.strictEqual(child.description(), 'Child command');
  });

  await t.step('should support mix of Nodes and Classes in subCommands', async () => {
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

    assert.ok(root.commander.commands.find((c) => c.name() === 'node-sub'));
    assert.ok(root.commander.commands.find((c) => c.name() === 'class-sub'));
  });

  await t.step('should override node metadata with CmdParams', async () => {
    const node: CliApp.CommandNode<TestContext> = {
      name: 'node-name',
      version: '1.0.0',
    };
    const ParamsCmd = CliApp.Cmd.create(node, { name: 'param-name', version: '2.0.0', root: true });
    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const cmd = new ParamsCmd(ctx);
    await cmd.init();
    assert.strictEqual(cmd.commander.name(), 'param-name');
    assert.strictEqual(cmd.commander.version(), '2.0.0');
  });
});
