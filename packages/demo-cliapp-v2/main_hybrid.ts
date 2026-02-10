import * as CliApp from '@epdoc/cliapp';
import pkg from './deno.json' with { type: 'json' };
import * as App from './src/mod.ts';
import { SubCommand } from './src/commands/sub.ts';

/**
 * Demo: Hybrid Implementation
 *
 * Demonstrates:
 * - Mixing AbstractCommand classes with CommandNode object literals
 * - Class-based root with declarative leaves
 */

export class HybridRoot extends CliApp.Cmd.AbstractBase<App.Ctx.AppContext, App.Ctx.AppContext> {
  constructor() {
    super(undefined, {
      name: pkg.name,
      version: pkg.version,
      description: 'Hybrid CLI mixing classes and objects',
      root: true,
      dryRun: true,
    });
  }

  override createContext(_parent?: App.Ctx.AppContext): App.Ctx.AppContext {
    const ctx = new App.Ctx.AppContext(pkg);
    return ctx;
  }

  override async hydrateContext(_opts: CliApp.CmdOptions, _args: CliApp.CmdArgs): Promise<void> {
    await this.ctx.setupLogging();
  }

  override execute(_opts: CliApp.CmdOptions, _args: CliApp.CmdArgs): void {
    this.commander.help();
  }

  protected override getSubCommands(): CliApp.Cmd.AbstractBase<App.Ctx.AppContext, App.Ctx.AppContext>[] {
    // Mix class-based and declarative subcommands
    const DeclarativeCmd = CliApp.Cmd.create<App.Ctx.AppContext, App.Ctx.AppContext>({
      name: 'declarative',
      description: 'A declarative leaf in a class-based tree',
      options: {
        '--shout': 'Shout the message',
      },
      action: (ctx, opts) => {
        let msg = 'Hello from the declarative node!';
        if (opts.shout) msg = msg.toUpperCase();
        ctx.log.info.text(msg).emit();
      },
      subCommands: {
        nested: {
          description: 'A nested declarative command',
          action: (ctx) => {
            ctx.log.info.text('Deep nested success!').emit();
          },
        },
      },
    });

    return [
      new SubCommand(),
      new DeclarativeCmd(),
    ];
  }
}

if (import.meta.main) {
  const ctx = new App.Ctx.AppContext(pkg);
  await ctx.setupLogging();

  const rootCmd = new HybridRoot();
  await rootCmd.init();

  CliApp.run(ctx, rootCmd);
}
