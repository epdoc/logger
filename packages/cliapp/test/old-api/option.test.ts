import * as _ from '@epdoc/type';
import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import * as Console from '@epdoc/msgbuilder';
import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { FluentOptionBuilder } from '../src/option.ts';

type M = Console.Console.Builder;
type L = Log.Std.Logger<M>;

class TestContext extends CliApp.Context<L> {
  constructor(pkg: CliApp.DenoPkg) {
    super(pkg);
  }

  async setupLogging() {
    this.logMgr = new Log.Mgr<M>();
    this.logMgr.msgBuilderFactory = Console.Console.createMsgBuilder;
    this.logMgr.initLevels(Log.Std.factoryMethods);
    this.logMgr.threshold = 'info';
    this.log = await this.logMgr.getLogger<L>();
  }
}

interface TestOptions {
  format?: string;
  lines?: number;
  verbose?: boolean;
  token?: string;
  debug?: boolean;
  quiet?: boolean;
}

describe('FluentOptionBuilder', () => {
  it('should create fluent option with choices and default', () => {
    const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
    const ctx = new TestContext(pkg);

    class TestCmd extends CliApp.BaseCommand<TestContext, TestOptions> {
      constructor(ctx: TestContext) {
        super(ctx, 'test', 'Test command');
      }

      protected override addOptions(): void {
        this.cmd
          .opt('--format <type>', 'Output format')
          .choices(['json', 'yaml', 'table'])
          .default('table')
          .emit();
      }
    }

    const testCmd = new TestCmd(ctx);
    const cmd = testCmd.cmd;

    // Verify option was added by checking help text contains the option
    const helpText = cmd.helpInformation();
    assertEquals(helpText.includes('--format <type>'), true);
    assertEquals(helpText.includes('Output format'), true);
  });

  it('should create fluent option with argParser and default', () => {
    const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
    const ctx = new TestContext(pkg);

    class TestCmd extends CliApp.BaseCommand<TestContext, TestOptions> {
      constructor(ctx: TestContext) {
        super(ctx, 'test', 'Test command');
      }

      protected override addOptions(): void {
        this.cmd
          .opt('-l --lines [num]', 'Number of lines')
          .default(10)
          .argParser(_.asInt)
          .emit();
      }
    }

    const testCmd = new TestCmd(ctx);
    const cmd = testCmd.cmd;

    // Verify option was added
    const helpText = cmd.helpInformation();
    assertEquals(helpText.includes('-l --lines [num]'), true);
    assertEquals(helpText.includes('Number of lines'), true);
  });

  it('should support method chaining for multiple options', () => {
    const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
    const ctx = new TestContext(pkg);

    class TestCmd extends CliApp.BaseCommand<TestContext, TestOptions> {
      constructor(ctx: TestContext) {
        super(ctx, 'test', 'Test command');
      }

      protected override addOptions(): void {
        this.cmd
          .opt('--format <type>', 'Output format')
          .choices(['json', 'yaml'])
          .default('json')
          .emit()
          .opt('-v --verbose', 'Verbose output')
          .default(false)
          .emit();
      }
    }

    const testCmd = new TestCmd(ctx);
    const cmd = testCmd.cmd;

    const helpText = cmd.helpInformation();
    assertEquals(helpText.includes('--format <type>'), true);
    assertEquals(helpText.includes('-v --verbose'), true);
  });

  it('should support all fluent methods', () => {
    const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
    const ctx = new TestContext(pkg);

    class TestCmd extends CliApp.BaseCommand<TestContext, TestOptions> {
      constructor(ctx: TestContext) {
        super(ctx, 'test', 'Test command');
      }

      protected override addOptions(): void {
        this.cmd
          .opt('--token <token>', 'API token')
          .env('API_TOKEN')
          .required()
          .emit()
          .opt('--debug', 'Debug mode')
          .conflicts(['quiet'])
          .hideHelp()
          .emit();
      }
    }

    const testCmd = new TestCmd(ctx);
    // Just verify it doesn't throw
  });

  it('should work with fluentOption alias', () => {
    const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
    const ctx = new TestContext(pkg);

    class TestCmd extends CliApp.BaseCommand<TestContext, TestOptions> {
      constructor(ctx: TestContext) {
        super(ctx, 'test', 'Test command');
      }

      protected override addOptions(): void {
        this.cmd
          .fluentOption('--test <value>', 'Test option')
          .default('test')
          .emit();
      }
    }

    const testCmd = new TestCmd(ctx);
    const cmd = testCmd.cmd;

    const helpText = cmd.helpInformation();
    assertEquals(helpText.includes('--test <value>'), true);
  });

  it('should return FluentOptionBuilder instance', () => {
    const pkg = { name: 'test', version: '1.0.0', description: 'Test' };
    const ctx = new TestContext(pkg);

    class TestCmd extends CliApp.BaseCommand<TestContext, TestOptions> {
      constructor(ctx: TestContext) {
        super(ctx, 'test', 'Test command');
      }

      protected override addOptions(): void {
        const builder = this.cmd.opt('--test', 'Test option');

        assertEquals(builder instanceof FluentOptionBuilder, true);
        assertEquals(typeof builder.choices, 'function');
        assertEquals(typeof builder.default, 'function');
        assertEquals(typeof builder.emit, 'function');

        builder.emit();
      }
    }

    new TestCmd(ctx);
  });
});
