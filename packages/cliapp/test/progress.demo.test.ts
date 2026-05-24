import * as CliApp from '../src/mod.ts';

const pkg = { name: 'test-app', version: '1.0.0', description: 'Test' };

class Context extends CliApp.Ctx.AbstractBase {}

abstract class BaseClass extends CliApp.BaseClass<Context, CliApp.Progress.MsgBuilder, CliApp.Ctx.Logger> {}

class App extends BaseClass {
  testFn(): Promise<void> {
    this.ctx.log.info.text('testFn').emit();
    return Promise.resolve();
  }
}

if (import.meta.main) {
  const ctx = new Context(pkg);
  await ctx.setupLogging();

  const app = new App(ctx);

  CliApp.run(ctx, app.testFn);
}
