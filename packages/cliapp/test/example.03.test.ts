import type * as Log from '@epdoc/logger';
import pkg from '../deno.json' with { type: 'json' };
import * as CliApp from '../src/mod.ts';

// Define your contexts
class RootContext extends CliApp.Ctx.AbstractBase {
  debugMode = false;

  // Use default setupLogging
}

class ChildContext extends RootContext {
  processedFiles = 0;

  constructor(parent: RootContext, params?: Log.IGetChildParams) {
    super(parent, params);
    // Inherit custom properties from parent
    this.debugMode = parent.debugMode;
  }
}

type RootOptions = CliApp.LogOptions & { rootOption: boolean };
type SubOptions = { subOption: boolean };

// Define commands using 100% declarative approach
const RootCommand = CliApp.Cmd.create<RootContext, RootContext, RootOptions>(
  {
    name: pkg.name,
    description: pkg.description,
    options: {
      '--root-option': 'Example root command option',
    },
    hydrate: (ctx, opts) => {
      ctx.debugMode = (opts as RootOptions).rootOption;
    },
    subCommands: {
      process: CliApp.Cmd.create<ChildContext, RootContext, SubOptions>({
        name: 'process',
        description: 'Process files',
        arguments: ['<files...>'],
        options: {
          '--sub-option': 'Example subcommand option',
        },
        refineContext: (parent: RootContext) => {
          return new ChildContext(parent, { pkg: 'child' });
        },
        action: ((ctx: ChildContext, opts, ...files: string[]) => {
          ctx.log.info.h1('Processing:').emit();
          ctx.log.indent();
          ctx.log.info.label('Sub option:').value(
            (opts as SubOptions).subOption,
          ).emit();
          ctx.log.info.label('Files:').count(files.length).value('file').emit();
          ctx.log.debug.label('Root option (from parent):').value(ctx.debugMode)
            .emit();
          ctx.log.outdent();

          // Process files...
          ctx.processedFiles = files.length;
        }) as CliApp.CommandNode<ChildContext>['action'],
      }),
    },
  },
  { root: true }, // Mark as root
);

// Run your application
if (import.meta.main) {
  // Create initial context for logging setup
  const initialCtx = new RootContext(pkg);
  await initialCtx.setupLogging();

  const rootCmd = new RootCommand(initialCtx);

  await CliApp.run(initialCtx, rootCmd);
}
