import type * as CliApp from '@epdoc/cliapp';
import * as _ from '@epdoc/type';
import * as Ctx from './context.ts';

/**
 * Demo: Purely Declarative Implementation
 *
 * Demonstrates:
 * - Defining commands using CommandNode object literals
 * - Using createCommand factory to build command classes
 * - Nested subcommands as object literals
 * - Custom message builder with params() method
 */

type DeclarativeOpts = CliApp.CmdOptions & { name?: string; 'happy-mode'?: boolean };
type HelloOpts = { time: number };

export const TREE: CliApp.CommandNode<Ctx.RootContext, DeclarativeOpts> = {
  name: 'main_declarative',
  description: 'A Purely Declarative Demo',
  options: {
    '--happy-mode': 'Enable happy mode',
    '--name <name>': 'Your name',
  },
  helpText: [
    { text: '\nThis is help text for the root command.' },
    { text: 'This is more help text for the root command.' },
  ],
  hydrateContext(ctx: Ctx.RootContext, opts: DeclarativeOpts): void {
    ctx.log.info.section('main_declarative hydrateContext').emit();
    // We can apply the options to the context here, or in the action method
    ctx.name = opts.name ? opts.name : undefined;
    ctx.happyMode = opts.happyMode ? true : false;
    ctx.log.info.label('name').value(ctx.name).emit();
    ctx.log.info.happy(ctx).emit();
    ctx.log.info.context(ctx).emit();
    ctx.log.info.h2('Our AppContext is now hydrated.').emit();
    ctx.log.info.h2(
      'For a root command, this is the only place where the context is hydrated when calling a subcommand',
    ).emit();
    ctx.log.info.section().emit();
  },

  action: (ctx, opts, args) => {
    ctx.log.info.section('main_declarative action').emit();
    ctx.log.info.opts(opts, args).emit();
    ctx.log.info.happy(ctx).emit();
    ctx.log.info.context(ctx).emit();
    ctx.log.info.h2('This is only executed if there are no subcommands').emit();
    ctx.log.info.h2('By default this will show help instead').emit();
    ctx.log.info.section().emit();
  },
  subCommands: {
    hello: {
      description: 'This command will say hello',
      options: {
        '--time <time>': {
          description: 'How many hours I will be here',
          default: '10',
          required: true,
          argParser: _.asInt,
        },
      },
      helpText: [{ text: '\nThis is help text for the hello command.' }],
      createContext: (ctx: Ctx.RootContext): Ctx.ChildContext => {
        ctx.log.info.section('hello createContext').emit();
        const result = new Ctx.ChildContext(ctx);
        ctx.log.info.context(result).emit();
        ctx.log.info.h2('We have chosen to create a new context for this command.').emit();
        ctx.log.info.h2('This is for demonstration purposes and is not a requirement.').emit();
        ctx.log.info.h2('This must be done separately from the hydrateContext() method.').emit();
        ctx.log.info.section().emit();
        return result;
      },
      hydrateContext: (ctx: Ctx.RootContext, opts: HelloOpts) => {
        ctx.log.info.section('hello hydrateContext').emit();
        if (ctx instanceof Ctx.ChildContext) {
          ctx.time = opts.time;
          ctx.log.info.context(ctx).emit();
          ctx.log.info.opts(opts).emit();
          ctx.log.info.h2('Demonstrating setting the ChildContext').label('time').value(ctx.time).emit();
          ctx.log.info.h2('But this method is optional: we could have deferred this to the action method.').emit();
          ctx.log.info.section().emit();
        }
      },
      action: (ctx: Ctx.ChildContext, opts: HelloOpts) => {
        ctx.log.info.section('hello action').emit();
        ctx.log.info.text(`Hello, ${ctx.name ?? 'World'}!`).emit();
        ctx.log.info.happy(ctx).emit();
        ctx.log.info.h2('Options have the same values as in hydateContext().').emit();
        ctx.log.info.opts(opts).emit();
        ctx.log.info.context(ctx).emit();
        ctx.log.info.section().emit();
      },
    },
    goodbye: {
      description: 'This command will say goodbye to a file',
      arguments: ['<filename>'],
      action: (ctx: Ctx.RootContext, opts: CliApp.CmdOptions, args: CliApp.CmdArgs) => {
        ctx.log.info.section('goodbye action').emit();
        ctx.log.info.text(`Goodbye, ${ctx.name ?? 'World'}!`).emit();
        ctx.log.info.happy(ctx).emit();
        ctx.log.info.opts(opts, args).emit();
        ctx.log.info.h2('We get').label('filename').value(args[0]).h2('from the arguments').emit();
        ctx.log.info.h2('We choose not to store the filename in the context (but we could have)').emit();
        ctx.log.info.h2('This command uses the AppContext, not a ChildContext').emit();
        ctx.log.info.context(ctx).emit();
        ctx.log.info.h2('And this is where we would execute business logic').emit();
        ctx.log.info.section().emit();
      },
    },
  },
};
