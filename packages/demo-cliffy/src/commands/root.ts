import type { AppContext } from '../context.ts';
import { CliffApp } from '../dep.ts';
import { SubCommand } from './sub.ts';

export class RootCommand extends CliffApp.AbstractCmd<AppContext> {
  protected override subCommands = {
    sub: SubCommand,
  };

  protected override setupOptions(): void {
    this.cmd
      .name(this.ctx.pkg.name)
      .version(this.ctx.pkg.version)
      .description(this.ctx.pkg.description!)
      .action(() => {
        this.cmd.showHelp();
      });

    // Add standard logging options from cliffapp
    CliffApp.addLoggingOptions(this.cmd, this.ctx);
  }
}
