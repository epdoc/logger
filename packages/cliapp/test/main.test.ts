import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import { assertEquals } from '@std/assert';
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

describe('CliApp.run', () => {
  it('should execute command and return successfully', async () => {
    let executed = false;
    class SuccessCmd extends CliApp.BaseCommand<TestContext, TestContext> {
      constructor(ctx: TestContext) {
        super(ctx, { name: 'test' });
      }
      override createContext(parent?: TestContext): TestContext {
        return (parent || this.parentContext)!;
      }
      override execute() {
        executed = true;
      }
    }

    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const cmd = new SuccessCmd(ctx);

    const originalExit = Deno.exit;
    let _exitCode: number | undefined;
    // @ts-ignore: Mocking Deno.exit
    Deno.exit = (code?: number) => {
      _exitCode = code;
    };

    const originalArgs = Deno.args;
    // @ts-ignore: Mocking Deno.args
    Deno.args = ['test'];

    try {
      await CliApp.run(ctx, cmd, { noExit: true });
      assertEquals(executed, true);
    } finally {
      Deno.exit = originalExit;
      // @ts-ignore: Restoring Deno.args
      Deno.args = originalArgs;
    }
  });

  it('should handle SilentError with exit code 1', async () => {
    class ErrorCmd extends CliApp.BaseCommand<TestContext, TestContext> {
      constructor(ctx: TestContext) {
        super(ctx, { name: 'test' });
      }
      override createContext(parent?: TestContext): TestContext {
        return (parent || this.parentContext)!;
      }
      override execute() {
        throw new CliApp.SilentError('Silent failure');
      }
    }

    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const cmd = new ErrorCmd(ctx);

    const originalExit = Deno.exit;
    let exitCode: number | undefined;
    // @ts-ignore: Mocking Deno.exit
    Deno.exit = (code?: number) => {
      exitCode = code;
    };

    const originalArgs = Deno.args;
    // @ts-ignore: Mocking Deno.args
    Deno.args = ['test'];

    try {
      await CliApp.run(ctx, cmd, { noExit: false });
      assertEquals(exitCode, 1);
    } finally {
      Deno.exit = originalExit;
      // @ts-ignore: Restoring Deno.args
      Deno.args = originalArgs;
    }
  });

  it('should handle regular Error with exit code 1', async () => {
    class CrashCmd extends CliApp.BaseCommand<TestContext, TestContext> {
      constructor(ctx: TestContext) {
        super(ctx, { name: 'test' });
      }
      override createContext(parent?: TestContext): TestContext {
        return (parent || this.parentContext)!;
      }
      override execute() {
        throw new Error('Boom');
      }
    }

    const ctx = new TestContext(pkg);
    await ctx.setupLogging();
    const cmd = new CrashCmd(ctx);

    const originalExit = Deno.exit;
    let exitCode: number | undefined;
    // @ts-ignore: Mocking Deno.exit
    Deno.exit = (code?: number) => {
      exitCode = code;
    };

    const originalArgs = Deno.args;
    // @ts-ignore: Mocking Deno.args
    Deno.args = ['test'];

    try {
      await CliApp.run(ctx, cmd, { noExit: false });
      assertEquals(exitCode, 1);
    } finally {
      Deno.exit = originalExit;
      // @ts-ignore: Restoring Deno.args
      Deno.args = originalArgs;
    }
  });
});
