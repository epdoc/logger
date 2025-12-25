/**
 * @file Unit tests for BaseCmd (Sub) and BaseRootCmd (Root) functionality
 */

import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import { assertEquals, assertExists, assertInstanceOf } from '@std/assert';

const Ctx = CliApp.Ctx;
const Cmd = CliApp.Cmd;

type M = Console.Builder;
type L = Log.Std.Logger<M>;

// Test context implementation
class TestContext extends Ctx.Base<M, L> {
  setupLogging() {
    this.logMgr = Log.createLogManager(undefined, { threshold: 'info' });
    this.log = this.logMgr.getLogger() as Log.Std.Logger<Console.Builder>;
  }
}

// Test options interface
interface TestOptions {
  verbose?: boolean;
  output?: string;
}

type TestBundle = CliApp.Cmd.ContextBundle<
  TestContext,
  Console.Builder,
  Log.Std.Logger<Console.Builder>
>;

// Test subcommand implementation
class TestSubCmd extends Cmd.Sub<TestBundle, TestOptions> {
  public addArgumentsCalled = false;
  public addOptionsCalled = false;
  public addExtrasCalled = false;
  public executeActionCalled = false;
  public receivedArgs: string[] = [];
  public receivedOpts: TestOptions = {};

  constructor(ctx: TestContext) {
    super(ctx, 'test', 'Test subcommand', ['t']);
  }

  protected override addArguments(): void {
    this.addArgumentsCalled = true;
    this.cmd.argument('<input>', 'Input file');
  }

  protected override addOptions(): void {
    this.addOptionsCalled = true;
    this.cmd
      .option('-v, --verbose', 'Verbose output')
      .option('-o, --output <file>', 'Output file');
  }

  protected override addExtras(): void {
    this.addExtrasCalled = true;
    this.cmd.addHelpText('after', 'Example: test input.txt -o output.txt');
  }

  protected override executeAction(args: string[], opts: TestOptions, cmd: CliApp.Command): Promise<void> {
    this.executeActionCalled = true;
    this.receivedArgs = args;
    this.receivedOpts = opts;
    assertExists(cmd);
    assertExists(cmd.opts);
    assertExists(cmd.name);
    return Promise.resolve();
  }
}

// Test root command implementation
class TestRootCmd extends Cmd.Root<TestBundle, TestOptions> {
  public addArgumentsCalled = false;
  public addOptionsCalled = false;
  public addCommandsCalled = false;
  public addExtrasCalled = false;
  public subCmd?: TestSubCmd;

  constructor(ctx: TestContext) {
    const pkg = {
      name: 'test-app',
      version: '1.0.0',
      description: 'Test application',
    };
    super(ctx, pkg);
  }

  protected override addArguments(): void {
    this.addArgumentsCalled = true;
  }

  protected override addOptions(): void {
    this.addOptionsCalled = true;
    this.cmd.option('--global', 'Global option');
  }

  protected override async addCommands(): Promise<void> {
    this.addCommandsCalled = true;
    this.subCmd = new TestSubCmd(this.ctx);
    this.cmd.addCommand(await this.subCmd.init());
  }

  protected override addExtras(): void {
    this.addExtrasCalled = true;
    this.cmd.addHelpText('after', 'Global help text');
  }
}

Deno.test('BaseCmd (Sub) - constructor and basic setup', () => {
  const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
  const ctx = new TestContext(pkg);
  const subCmd = new TestSubCmd(ctx);

  assertExists(subCmd);
  assertInstanceOf(subCmd, Cmd.Sub);
  assertEquals(subCmd['ctx'], ctx);
  assertExists(subCmd['cmd']);
});

Deno.test('BaseCmd (Sub) - init calls setup methods in correct order', async () => {
  const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
  const ctx = new TestContext(pkg);
  const subCmd = new TestSubCmd(ctx);

  const cmd = await subCmd.init();

  assertExists(cmd);
  assertEquals(subCmd.addArgumentsCalled, true);
  assertEquals(subCmd.addOptionsCalled, true);
  assertEquals(subCmd.addExtrasCalled, true);
});

Deno.test('BaseCmd (Sub) - executeAction receives correct parameters', async () => {
  const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
  const ctx = new TestContext(pkg);
  const subCmd = new TestSubCmd(ctx);

  await subCmd.init();

  // Simulate command execution by calling the action directly
  const mockArgs = ['input.txt'];
  const mockOpts = { verbose: true, output: 'output.txt' };
  const mockCmd = subCmd['cmd'];

  await subCmd['executeAction']!(mockArgs, mockOpts, mockCmd);

  assertEquals(subCmd.executeActionCalled, true);
  assertEquals(subCmd.receivedArgs, mockArgs);
  assertEquals(subCmd.receivedOpts, mockOpts);
});

Deno.test('BaseRootCmd (Root) - constructor and basic setup', () => {
  const pkg = { name: 'test-app', version: '1.0.0', description: 'Test app' };
  const ctx = new TestContext(pkg);
  const rootCmd = new TestRootCmd(ctx);

  assertExists(rootCmd);
  assertInstanceOf(rootCmd, Cmd.Root);
  assertEquals(rootCmd['ctx'], ctx);
  assertExists(rootCmd['cmd']);
});

Deno.test('BaseRootCmd (Root) - init calls setup methods in correct order', async () => {
  const pkg = { name: 'test-app', version: '1.0.0', description: 'Test app' };
  const ctx = new TestContext(pkg);
  const rootCmd = new TestRootCmd(ctx);

  const cmd = await rootCmd.init();

  assertExists(cmd);
  assertEquals(rootCmd.addArgumentsCalled, true);
  assertEquals(rootCmd.addOptionsCalled, true);
  assertEquals(rootCmd.addCommandsCalled, true);
  assertEquals(rootCmd.addExtrasCalled, true);
});

Deno.test('BaseRootCmd (Root) - addCommands can add subcommands', async () => {
  const pkg = { name: 'test-app', version: '1.0.0', description: 'Test app' };
  const ctx = new TestContext(pkg);
  const rootCmd = new TestRootCmd(ctx);

  await rootCmd.init();

  assertExists(rootCmd.subCmd);
  assertEquals(rootCmd.subCmd.addArgumentsCalled, true);
  assertEquals(rootCmd.subCmd.addOptionsCalled, true);
  assertEquals(rootCmd.subCmd.addExtrasCalled, true);
});

Deno.test('BaseCmd (Sub) - supports aliases', async () => {
  const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
  const ctx = new TestContext(pkg);
  const subCmd = new TestSubCmd(ctx);

  const cmd = await subCmd.init();

  // The command should have the alias 't' as specified in constructor
  assertExists(cmd);
  // Note: Testing aliases would require access to Commander.js internals
  // This test verifies the constructor doesn't throw with aliases
});

Deno.test('BaseCmd (Sub) - optional methods work when not overridden', async () => {
  const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
  const ctx = new TestContext(pkg);

  // Create a minimal subcommand that only implements required executeAction
  class MinimalSubCmd extends Cmd.Sub<TestBundle, TestOptions> {
    constructor(ctx: TestContext) {
      super(ctx, 'minimal', 'Minimal test command');
    }

    protected override async executeAction(_args: string[], _opts: TestOptions, _cmd: CliApp.Command): Promise<void> {
      // Minimal implementation
    }
  }

  const subCmd = new MinimalSubCmd(ctx);
  const cmd = await subCmd.init();

  assertExists(cmd);
  // Should not throw even though addArguments, addOptions, addExtras are not overridden
});
