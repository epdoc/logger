/**
 * @file Unit tests for command arguments functionality using Cmd.Sub and Cmd.Root
 */

import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import * as Console from '@epdoc/msgbuilder';
import { assertEquals, assertExists } from '@std/assert';

type M = Console.Console.Builder;
type L = Log.Std.Logger<M>;

class TestContext extends CliApp.Ctx.Base<L> {
  constructor(pkg?: CliApp.DenoPkg) {
    super(pkg);
    this.setupLogging();
  }

  setupLogging() {
    this.logMgr = new Log.Mgr<M>();
    this.logMgr.msgBuilderFactory = Console.Console.createMsgBuilder;
    this.logMgr.init(Log.Std.factoryMethods);
    this.logMgr.threshold = 'info';
    this.log = this.logMgr.getLogger<L>();
  }
}

type TestBundle = CliApp.Cmd.ContextBundle<TestContext>;

interface TestOptions {
  verbose?: boolean;
}

Deno.test('Arguments - Required argument', async () => {
  class TestCmd extends CliApp.Cmd.Sub<TestBundle, TestOptions> {
    receivedArgs: string[] = [];

    constructor(ctx: TestContext) {
      super(ctx, 'test', 'Test command');
    }

    protected override addArguments(): void {
      this.cmd.argument('<file>', 'Input file');
    }

    protected override executeAction(args: string[], _opts: TestOptions, _cmd: CliApp.Command): Promise<void> {
      this.receivedArgs = args;
      return Promise.resolve();
    }
  }

  const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
  const ctx = new TestContext(pkg);
  const testCmd = new TestCmd(ctx);
  const cmd = await testCmd.init();

  assertExists(cmd);
  // Simulate execution with args
  await testCmd['executeAction']!(['test.txt'], {}, cmd);
  assertEquals(testCmd.receivedArgs, ['test.txt']);
});

Deno.test('Arguments - Optional argument', async () => {
  class TestCmd extends CliApp.Cmd.Sub<TestBundle, TestOptions> {
    receivedArgs: string[] = [];

    constructor(ctx: TestContext) {
      super(ctx, 'test', 'Test command');
    }

    protected override addArguments(): void {
      this.cmd.argument('[file]', 'Input file');
    }

    protected override executeAction(args: string[], _opts: TestOptions, _cmd: CliApp.Command): Promise<void> {
      this.receivedArgs = args;
      return Promise.resolve();
    }
  }

  const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
  const ctx = new TestContext(pkg);
  const testCmd = new TestCmd(ctx);
  const cmd = await testCmd.init();

  assertExists(cmd);
  // Test with no args (optional)
  await testCmd['executeAction']!([], {}, cmd);
  assertEquals(testCmd.receivedArgs, []);
});

Deno.test('Arguments - Variadic argument', async () => {
  class TestCmd extends CliApp.Cmd.Sub<TestBundle, TestOptions> {
    receivedArgs: string[] = [];

    constructor(ctx: TestContext) {
      super(ctx, 'test', 'Test command');
    }

    protected override addArguments(): void {
      this.cmd.argument('[files...]', 'Input files');
    }

    protected override executeAction(args: string[], _opts: TestOptions, _cmd: CliApp.Command): Promise<void> {
      this.receivedArgs = args;
      return Promise.resolve();
    }
  }

  const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
  const ctx = new TestContext(pkg);
  const testCmd = new TestCmd(ctx);
  const cmd = await testCmd.init();

  assertExists(cmd);
  // Test with multiple files
  await testCmd['executeAction']!(['file1.txt', 'file2.txt', 'file3.txt'], {}, cmd);
  assertEquals(testCmd.receivedArgs, ['file1.txt', 'file2.txt', 'file3.txt']);
});

Deno.test('Arguments - Multiple arguments', async () => {
  class TestCmd extends CliApp.Cmd.Sub<TestBundle, TestOptions> {
    receivedArgs: string[] = [];

    constructor(ctx: TestContext) {
      super(ctx, 'test', 'Test command');
    }

    protected override addArguments(): void {
      this.cmd
        .argument('<input>', 'Input file')
        .argument('[output]', 'Output file');
    }

    protected override executeAction(args: string[], _opts: TestOptions, _cmd: CliApp.Command): Promise<void> {
      this.receivedArgs = args;
      return Promise.resolve();
    }
  }

  const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
  const ctx = new TestContext(pkg);
  const testCmd = new TestCmd(ctx);
  const cmd = await testCmd.init();

  assertExists(cmd);
  // Test with both arguments
  await testCmd['executeAction']!(['input.txt', 'output.txt'], {}, cmd);
  assertEquals(testCmd.receivedArgs, ['input.txt', 'output.txt']);
});

Deno.test('Arguments - Root command with arguments', async () => {
  class TestRootCmd extends CliApp.Cmd.Root<TestBundle, TestOptions> {
    receivedArgs: string[] = [];

    constructor(ctx: TestContext) {
      const pkg = { name: 'test', version: '1.0.0', description: 'Test root' };
      super(ctx, pkg);
    }

    protected override addArguments(): void {
      this.cmd.argument('[command]', 'Command to run');
    }

    protected override executeAction(args: string[], _opts: TestOptions, _cmd: CliApp.Command): Promise<void> {
      this.receivedArgs = args;
      return Promise.resolve();
    }
  }

  const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
  const ctx = new TestContext(pkg);
  const rootCmd = new TestRootCmd(ctx);
  const cmd = await rootCmd.init();

  assertExists(cmd);
  // Test root command with argument
  await rootCmd['executeAction']!(['subcommand'], {}, cmd);
  assertEquals(rootCmd.receivedArgs, ['subcommand']);
});
