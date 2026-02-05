/**
 * @file Command factory for declarative command creation
 * @description Factory function to create BaseCommand subclasses from CommandNode configuration
 */

import { BaseCommand } from './cmd-abstract.ts';
import type * as Ctx from './context.ts';
import type * as CliApp from './types.ts';

/**
 * Create a command class from declarative CommandNode configuration
 *
 * The factory returns a class (not an instance) that extends BaseCommand.
 * You can then instantiate it: `new MyCommand(initialContext)`
 *
 * @param node - Declarative command configuration
 * @returns A class extending BaseCommand that implements the configuration
 *
 * @example
 * ```typescript
 * const ProcessCommand = createCommand<ChildContext, RootContext>({
 *   name: 'process',
 *   description: 'Process files',
 *   arguments: ['<files...>'],
 *   options: {
 *     '-f, --force': 'Force processing'
 *   },
 *   action: async (ctx, opts, ...files) => {
 *     ctx.log.info.text(`Processing ${files.length} files`).emit();
 *   }
 * });
 *
 * // Later, instantiate it:
 * const cmd = new ProcessCommand();
 * ```
 */
export function createCommand<
  TContext extends TParentContext,
  TParentContext extends Ctx.ICtx = Ctx.ICtx,
  TOpts extends CliApp.CmdOptions = CliApp.CmdOptions,
>(
  node: CliApp.CommandNode<TContext>,
): new (initialContext?: TParentContext) => BaseCommand<TContext, TParentContext, TOpts> {
  // Return an anonymous class that extends BaseCommand
  return class extends BaseCommand<TContext, TParentContext, TOpts> {
    constructor(initialContext?: TParentContext) {
      super(node.name, initialContext);
    }

    defineMetadata(): void {
      if (node.description) this.commander.description(node.description);
      if (node.aliases) this.commander.aliases(node.aliases);
    }

    defineOptions(): void {
      if (node.arguments) {
        for (const arg of node.arguments) {
          this.commander.argument(arg);
        }
      }

      if (node.options) {
        for (const [flags, config] of Object.entries(node.options)) {
          const desc = typeof config === 'string' ? config : config.description;
          this.commander.option(flags, desc);
        }
      }
    }

    createContext(parent?: TParentContext): TContext {
      if (node.refineContext && parent) {
        // Call refineContext to create the child context
        // Note: opts/args not available yet, will be hydrated later
        return node.refineContext(parent as TContext, {}, []) as TContext;
      }
      return (parent || this.parentContext) as TContext;
    }

    hydrateContext(options: TOpts): void {
      // Allow declarative hydration via a callback
      if (node.hydrate) {
        node.hydrate(this.ctx, options);
      }
    }

    execute(opts: TOpts, args: CliApp.CmdArgs): void | Promise<void> {
      if (node.action) {
        return node.action(this.ctx, opts, ...args);
      }
      this.commander.help();
    }

    protected override getSubCommands(): BaseCommand<TContext, TContext>[] {
      if (!node.subCommands) return [];

      return Object.entries(node.subCommands).map(([_name, subConfig]) => {
        if (typeof subConfig === 'function') {
          // Class constructor
          return new subConfig();
        } else {
          // CommandNode - recursively create
          const SubClass = createCommand<TContext, TContext>(subConfig);
          return new SubClass();
        }
      });
    }
  };
}
