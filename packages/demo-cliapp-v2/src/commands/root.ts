import * as CliApp from '@epdoc/cliapp';
import pkg from '../../deno.json' with { type: 'json' };
import { AppContext } from '../context.ts';
import { SubCommand } from './sub.ts';

type RootOpts = CliApp.CmdOptions & { debugMode?: boolean };

export class RootCommand extends CliApp.Cmd.AbstractBase<AppContext, AppContext, RootOpts> {
  constructor() {
    super(undefined, {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      root: true,
      dryRun: true,
    });
  }

  override async defineOptions(): Promise<void> {
    await Promise.resolve();
    this.commander.option('--debug-mode', 'Enable special debug mode for context refinement demo');
  }

  override createContext(_parent?: AppContext): AppContext {
    const ctx = new AppContext(pkg);
    return ctx;
  }

  override async hydrateContext(opts: RootOpts, _args: CliApp.CmdArgs): Promise<void> {
    await this.ctx.setupLogging();
    if (opts.debugMode) {
      this.ctx.debugMode = true;
      this.ctx.log.info.text('Debug mode enabled').emit();
    }
  }

  override execute(_opts: RootOpts, _args: CliApp.CmdArgs): void {
    this.ctx.log.info.text('Root command options:').emit();
    this.ctx.log.indent();
    // Demonstrate using the custom params() method from CustomMsgBuilder
    this.ctx.log.info.params(this.ctx).emit();
    this.ctx.log.info.label('dryRun').value(this.ctx.dryRun).emit();
    this.ctx.log.outdent();
    this.commander.help();
  }

  protected override getSubCommands(): CliApp.Cmd.AbstractBase<AppContext, AppContext>[] {
    return [new SubCommand()];
  }
}
