# Detailed Steps to use CliApp

## Setup your Deno Project

## Setup Dependencies

```bash
deno add @epdoc/cliapp
deno add @epdoc/logger
deno add @epdoc/msgbuilder
deno add @epdoc/type
```

## Define a Context Class

Start by creating `src/context.ts`. Define your context class, and a custom message builder if you so please (it's a
good idea to start with one). Here is an example:

```ts
import * as CliApp from '@epdoc/cliapp';
import type * as Log from '@epdoc/logger';

export class CustomMsgBuilder extends CliApp.Ctx.MsgBuilder {
  demo(ctx: Context): this {
    return this.label(ctx.constructor.name).value(JSON.stringify(_.omit(ctx, ['log', 'logMgr', 'pkg'])));
  }
}

type CustomLogger = CliApp.Ctx.Logger;

export class Context extends CliApp.Ctx.AbstractBase<CustomMsgBuilder, CustomLogger> {
  prop1 = false;
  prop2 = 'value2';

  protected override builderClass = CustomMsgBuilder;

  constructor(pkg: CliApp.DenoPkg | Context, params: Log.IGetChildParams = {}) {
    super(pkg, params);
    if (pkg instanceof Context) {
      this.copyProperties(pkg);
    }
  }
}
```

## Define a Root Command Class

In `src/commands/root.ts` you can do the following:

```ts
import * as CliApp from '@epdoc/cliapp';
import type * as Ctx from '../context.ts';

type RootOpts = CliApp.CmdOptions & { happyMode?: boolean; name?: string };

export class RootCommand extends CliApp.Cmd.AbstractBase<Ctx.Context, Ctx.Context, RootOpts> {
  constructor(ctx: Ctx.Context) {
    super(ctx, { root: true, dryRun: true });
  }

  get info(): Ctx.CustomMsgBuilder {
    return this.ctx.log.info;
  }

  override defineOptions(): void {
    const ctx = this.ctx || this.parentContext;
    ctx.log.info.section('RootCommand defineOptions').emit();
    this.option('--prop1', 'Enable special prop1 on the RootCommand').emit();
    this.option('--prop2 <value>', 'Set special prop2 on the RootCommand').emit();
    this.addHelpText('\nThis is help text for the root command.');
    this.addHelpText('This is more help text for the root command.');
    ctx.log.info.section().emit();
  }

  override createContext(parent?: Ctx.RootContext): Ctx.RootContext {
    const ctx = this.ctx || this.parentContext;
    ctx.log.info.section('RootCommand createContext').emit();
    const result = parent ?? this.ctx;
    result.log.info.context(result).emit();
    result.log.info.section().emit();
    return result;
  }

  override hydrateContext(opts: RootOpts, _args: CliApp.CmdArgs): void {
    this.info.section('RootCommand hydrateContext').emit();
    // We can apply the options to the context here, or in the action method
    this.ctx.name = opts.name ? opts.name : undefined;
    this.ctx.happyMode = opts.happyMode ? true : false;
    this.info.label('name').value(this.ctx.name).emit();
    this.info.happy(this.ctx).emit();
    this.info.context(this.ctx).emit();
    this.info.h2('Our AppContext is now hydrated.').emit();
    this.info.h2(
      'For a root command, this is the only place where the context is hydrated when calling a subcommand',
    ).emit();
    this.info.section().emit();
  }

  override execute(_opts: RootOpts, _args: CliApp.CmdArgs): void {
    this.info.section('Root command execute').emit();
    this.ctx.log.indent();
    // Demonstrate using the custom params() method from CustomMsgBuilder
    this.info.happy(this.ctx).emit();
    this.info.label('dryRun').value(this.ctx.dryRun).emit();
    this.ctx.log.outdent();
    this.ctx.log.info.section().emit();
    this.commander.help();
  }

  protected override getSubCommands(): CliApp.Cmd.AbstractBase<Ctx.RootContext, Ctx.RootContext>[] {
    return [new SubCommand()];
  }
}
```
