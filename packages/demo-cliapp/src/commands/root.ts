import * as CliApp from '@epdoc/cliapp';
import type * as Ctx from '../context.ts';
import { SubCommand } from './sub.ts';

type RootOpts = CliApp.CmdOptions & { happyMode?: boolean; name?: string };

export class RootCommand extends CliApp.Cmd.AbstractBase<Ctx.RootContext, Ctx.RootContext, RootOpts> {
  constructor(ctx: Ctx.RootContext) {
    super(ctx, { root: true, dryRun: true });
  }

  get info(): Ctx.CustomMsgBuilder {
    return this.ctx.log.info;
  }

  override defineOptions(): void {
    const ctx = this.ctx || this.parentContext;
    ctx.log.info.section('RootCommand defineOptions').emit();
    this.option('--happy-mode', 'Enable special happy mode on the RootCommand').emit();
    this.option('--name <name>', 'Name to use for greeting').emit();
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
