import type * as CliApp from '@epdoc/cliapp';
import * as Ctx from '../context.ts';
import { ListCommand } from './list.ts';
import { ProcessCommand } from './process.ts';
import { SubCommand } from './sub.ts';

type RootCmdOpts = CliApp.CmdOptions & { happyMode?: boolean; name?: string };

export class RootCommand extends Ctx.BaseRootCmdClass<RootCmdOpts> {
  constructor(ctx: Ctx.RootContext) {
    super(ctx, { root: true, dryRun: true });
  }

  get info(): Ctx.CustomMsgBuilder {
    return this.ctx.log.info;
  }

  override defineOptions(): void {
    const ctx = this.activeContext()!;
    ctx.log.info.section('RootCommand defineOptions').emit();
    this.option('--happy-mode', 'Enable special happy mode on the RootCommand')
      .emit();
    this.option('--name <name>', 'Name to use for greeting').emit();
    this.addHelpText('\nThis is help text for the root command.');
    this.addHelpText('This is more help text for the root command.');
    ctx.log.info.h2('We added the root options and help text here.').emit();
    ctx.log.info.section().emit();
  }

  override createContext(parent?: Ctx.RootContext): Ctx.RootContext {
    const ctx = this.activeContext()!;
    ctx.log.info.section('RootCommand createContext').emit();
    const result = parent ?? this.ctx;
    result.log.info.demo(result).emit();
    result.log.info.h2('Returns the already assigned context for the RootCommand').emit();
    result.log.info.section().emit();
    return result;
  }

  override hydrateContext(opts: RootCmdOpts, _args: CliApp.CmdArgs): void {
    this.info.section('RootCommand hydrateContext').emit();
    // We can apply the options to the context here, or in the action method
    this.ctx.name = opts.name ? opts.name : undefined;
    this.ctx.happyMode = opts.happyMode ? true : false;
    this.info.demo(this.ctx).emit();
    this.info.h2('Our RootContext is now hydrated.').emit();
    this.info.h2(
      'For a root command, this is the only opportunity to hydrate the context (unless no subcommand is specified)',
    ).emit();
    this.info.section().emit();
  }

  override execute(_opts: RootCmdOpts, _args: CliApp.CmdArgs): void {
    this.info.section('Root command execute').emit();
    this.info.demo(this.ctx).emit();
    this.info.h2('Only executed when no subcommand is specified.').emit();
    this.info.h2('You can safely not implement the execute method and help will be shown instead.').emit();
    this.ctx.log.info.section().emit();
    // this.commander.help();
  }

  protected override getSubCommands() {
    return [
      new SubCommand(this.parentContext),
      new ProcessCommand(this.parentContext),
      new ListCommand(this.parentContext),
    ];
  }
}
