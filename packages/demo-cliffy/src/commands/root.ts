import type { AppContext } from '../context.ts';
import { CliffApp } from '../dep.ts';
import { SubCommand } from './sub.ts';

export class RootCommand extends CliffApp.AbstractCmd<AppContext> {
  // Functional subcommands: only show 'sub' command if not in special 'quiet' mode
  protected override subCommands = (ctx: AppContext) => {
    const cmds: CliffApp.SubCommandsConfig<AppContext> = {
      sub: SubCommand,
    };
    if (ctx.debugMode) {
      ctx.log.info.text('Debug mode enabled: subcommands are available').emit();
    }
    return cmds;
  };

  protected override refineContext(ctx: AppContext, opts: CliffApp.GenericOptions): AppContext {
    if (opts.debugMode) {
      // In a real app, you might return a new object or a modified clone
      ctx.debugMode = true;
      ctx.log.info.text('Refining context: setting debugMode = true').emit();
    }
    return ctx;
  }

  protected override setupOptions(): void {
    this.cmd
      .name(this.ctx.pkg.name)
      .version(this.ctx.pkg.version)
      .description(this.ctx.pkg.description!)
      .option('--debug-mode', 'Enable special debug mode for context refinement demo')
      .action(() => {
        this.cmd.showHelp();
      });

    // Add standard logging options from cliffapp
    CliffApp.addLoggingOptions(this.cmd, this.ctx);
  }
}
