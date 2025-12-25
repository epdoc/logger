import * as CliApp from '@epdoc/cliapp';
import type * as Ctx from '../context/mod.ts';
import { ListCmd } from './list.ts';
import { ProcessCmd } from './process.ts';

// These are options in addition to the standard CliApp log level options
interface AppOptions {
  verbose?: boolean;
  output?: string;
}

export class RootCmd extends CliApp.Cmd.Root<Ctx.AppBundle, AppOptions> {
  constructor(ctx: Ctx.Context) {
    super(ctx, ctx.pkg);
  }

  protected override addOptions(): void {
    this.cmd
      .addLogging(this.ctx)
      .option('--output <dir>', 'Output directory');
  }

  protected override addExtras(): void {
    this.cmd.hook('preAction', (cmd, _actionCmd) => {
      const opts = cmd.optsWithGlobals();
      CliApp.configureLogging(this.ctx, opts);
    });
  }

  protected override async addCommands(): Promise<void> {
    const listCmd = new ListCmd(this.ctx);
    const processCmd = new ProcessCmd(this.ctx);

    this.cmd.addCommand(await listCmd.init());
    this.cmd.addCommand(await processCmd.init());
  }

  // protected override executeAction(
  //   args: string[],
  //   opts: AppOptions,
  // ): Promise<void> {
  //   this.ctx.log.info.h1("Processing Files")
  //     .label("Files:").value(args.join(", "))
  //     .label("Output:").value(opts.output || "default")
  //     .emit();
  //   return Promise.resolve();
  // }
}
