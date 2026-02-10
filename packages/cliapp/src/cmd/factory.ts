/**
 * @file Command factory for declarative command creation
 * @description Factory function to create BaseCommand subclasses from CommandNode configuration
 */

import type * as Ctx from '../context.ts';
import type * as CliApp from '../types.ts';
import { AbstractCommand } from './abstract.ts';

/**
 * Create a command class from declarative CommandNode configuration
 *
 * The factory returns a class (not an instance) that extends BaseCommand.
 * You can then instantiate it: `new MyCommand(initialContext)`
 *
 * @param node - Declarative command configuration. Supports `name`, `description`,
 * `version`, `aliases`, `options`, `arguments`, `refineContext`, `hydrate`, `action`,
 * and `subCommands`.
 * @param params - Optional command parameters. Values here override those in `node`.
 * @param params.name - Command name.
 * @param params.description - Command description.
 * @param params.version - Command version (applied if root=true).
 * @param params.aliases - Command aliases (for subcommands).
 * @param params.root - Set to true for root command.
 * @param params.dryRun - Set to true to add --dry-run option.
 * @returns A class extending BaseCommand.
 */
export function createCommand<
  TContext extends TParentContext,
  TParentContext extends Ctx.AbstractBase = Ctx.AbstractBase,
  TOpts extends CliApp.CmdOptions = CliApp.CmdOptions,
>(
  node: CliApp.CommandNode<TContext>,
  params: CliApp.CmdParams = {},
): new (initialContext?: TParentContext) => AbstractCommand<TContext, TParentContext, TOpts> {
  // Return an anonymous class that extends BaseCommand
  return class extends AbstractCommand<TContext, TParentContext, TOpts> {
    constructor(initialContext?: TParentContext) {
      super(initialContext!, params);
    }

    override async init(): Promise<this> {
      // Apply node metadata if not overridden by params
      if (!this.params.name) this.params.name = node.name;
      if (!this.params.description) this.params.description = node.description;
      if (!this.params.version) this.params.version = node.version;
      if (!this.params.aliases) this.params.aliases = node.aliases;

      return await super.init();
    }

    override async defineOptions(): Promise<void> {
      await Promise.resolve();
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

    override createContext(parent?: TParentContext): Promise<TContext> | TContext {
      if (node.refineContext && parent) {
        // Call refineContext to create the child context
        // Note: opts/args not available yet, will be hydrated later
        return node.refineContext(parent as TContext, {}, []);
      }
      return (parent || this.parentContext) as TContext;
    }

    override hydrateContext(options: TOpts): void {
      // Allow declarative hydration via a callback
      if (node.hydrate) {
        node.hydrate(this.ctx, options);
      }
    }

    override execute(opts: TOpts, args: CliApp.CmdArgs): void | Promise<void> {
      if (node.action) {
        return node.action(this.ctx, opts, ...args);
      }
      this.commander.help();
    }

    protected override getSubCommands(): AbstractCommand<TContext, TContext>[] {
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
