import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import pkg from '../cliapp/deno.json' with { type: 'json' };

// 1. Define types once per project
type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

// 2. Create your context
class AppContext extends CliApp.Ctx.Base<Logger> {
  constructor() {
    super(pkg);
    this.setupLogging(); // Must call in constructor
  }

  async setupLogging() {
    this.logMgr = new Log.Mgr<Console.Builder>();
    this.logMgr.msgBuilderFactory = (emitter) => new Console.Builder(emitter as any);
    this.logMgr.initLevels(Log.Std.factoryMethods);
    this.logMgr.threshold = 'info';
    this.log = await this.logMgr.getLogger<Logger>();
  }
}

// 3. Define options interface
interface AppOptions {
  verbose?: boolean;
  output?: string;
}

// 4. Define your root command
class AppRootCmd extends CliApp.Cmd.Root<CliApp.Cmd.ContextBundle<AppContext>, AppOptions> {
  constructor(ctx: AppContext) {
    super(ctx, ctx.pkg);
  }

  protected override addArguments(): void {
    this.cmd.argument('[files...]', 'Files to process');
  }

  protected override addOptions(): void {
    this.cmd
      .option('--output <dir>', 'Output directory')
      .option('--verbose', 'Verbose output');
  }

  protected override executeAction(
    args: string[],
    opts: AppOptions,
  ): Promise<void> {
    this.ctx.log.info.h1('Processing Files')
      .label('Files:').value(args.join(', '))
      .label('Output:').value(opts.output || 'default')
      .emit();
    return Promise.resolve();
  }
}

// 5. Run it
if (import.meta.main) {
  const ctx = new AppContext();
  await ctx.setupLogging();
  const rootCmd = new AppRootCmd(ctx);
  const cmd = await rootCmd.init();
  await cmd.parseAsync();
}
