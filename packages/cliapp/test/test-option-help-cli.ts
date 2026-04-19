import type * as Log from '@epdoc/logger';
import pkg from '../deno.json' with { type: 'json' };
import * as CliApp from '../src/mod.ts';

// Define your context
class RootContext extends CliApp.Ctx.AbstractBase {
  debugMode = false;
}

type RootOptions = CliApp.LogCmdOptions & {
  config?: string;
  port?: number;
};

// Define your command using OptionDef with help text
class RootCommand extends CliApp.Cmd.AbstractBase<RootContext, RootContext, RootOptions> {
  constructor(initialContext: RootContext) {
    super(initialContext, { ...pkg, root: true });
  }

  override async defineOptions(): Promise<void> {
    await Promise.resolve();

    // Option with help text using fluent API
    this.option('-c, --config <path>', 'Path to config file')
      .helpText(
        'The configuration file path. Supports JSON, YAML, and TOML formats.\n' +
          'Default locations searched: ./config.json, ~/.apprc',
      )
      .emit();

    // Option with help text using OptionDef
    this.option({
      name: 'port',
      short: 'p',
      params: '<number>',
      description: 'Port to listen on',
      help: 'The TCP port number to bind to. Must be between 1024 and 65535.\n' +
        'Ports below 1024 require root privileges.',
      argParser: (val) => parseInt(val, 10),
    }).emit();
  }

  override createContext(parent?: RootContext): RootContext {
    return parent || this.parentContext!;
  }

  override hydrateContext(options: RootOptions): void {
    this.ctx.debugMode = !!options.config;
  }

  override execute(opts: RootOptions): void {
    this.ctx.log.info.h1('Configuration').emit();
    this.ctx.log.info.label('Config:').value(opts.config || 'none').emit();
    this.ctx.log.info.label('Port:').value(opts.port || 'none').emit();
  }
}

// Run your application
if (import.meta.main) {
  const initialCtx = new RootContext(pkg);
  await initialCtx.setupLogging();

  const rootCmd = new RootCommand(initialCtx);

  await CliApp.run(initialCtx, rootCmd);
}
