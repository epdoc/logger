import type * as CliApp from '@epdoc/cliapp';
import * as Ctx from '../context.ts';
import { ListCommand } from './list.ts';
import { QueryCommand } from './query.ts';
import { SubCommand } from './sub.ts';

type RootCmdOpts = CliApp.CmdOptions & { happyMode?: boolean; name?: string };

export class RootCommand extends Ctx.BaseRootCmdClass<RootCmdOpts> {
  constructor(ctx: Ctx.RootContext) {
    super(ctx, { root: true, dryRun: true });
  }

  override defineOptions(): void {
    this.log.info.section('RootCommand defineOptions').emit();
    this.option('--happy-mode', 'Enable special happy mode on the RootCommand')
      .emit();
    this.option('--name <name>', 'Name to use for greeting').emit();
    this.addHelpText('\nThis is help text for the root command.');
    this.addHelpText('This is more help text for the root command.');
    this.log.info.h2('We added the root options and help text here.').emit();
    this.log.info.section().emit();
  }

  override createContext(parent: Ctx.RootContext): Ctx.RootContext {
    this.log.info.section('RootCommand createContext').emit();
    this.log.info.demo(parent).emit();
    this.log.info.h2('Returns the already assigned context for the RootCommand').emit();
    this.log.info.section().emit();
    return parent;
  }

  override hydrateContext(opts: RootCmdOpts, _args: CliApp.CmdArgs): void {
    this.log.info.section('RootCommand hydrateContext').emit();
    // We can apply the options to the context here, or in the action method
    this.ctx.name = opts.name ? opts.name : undefined;
    this.ctx.happyMode = opts.happyMode ? true : false;
    this.log.info.demo(this.ctx).emit();
    this.log.info.logShow(this.ctx).emit();
    this.log.info.h2('Our RootContext is now hydrated.').emit();
    this.log.info.h2(
      'For a root command, this is the only opportunity to hydrate the context (unless no subcommand is specified)',
    ).emit();
    this.log.info.section().emit();
  }

  override execute(_opts: RootCmdOpts, _args: CliApp.CmdArgs): void {
    this.log.info.section('Root command execute').emit();
    this.log.info.demo(this.ctx).emit();
    this.log.info.logShow(this.ctx).emit();
    this.log.info.h2('Only executed when no subcommand is specified.').emit();
    this.log.info.h2('You can safely not implement the execute method and help will be shown instead.').emit();
    this.log.info.section().emit();
    // this.commander.help();
  }

  protected override getSubCommands() {
    return [
      new SubCommand(this.parentContext),
      new QueryCommand(this.parentContext),
      new ListCommand(this.parentContext),
    ];
  }
}
