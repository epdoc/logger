import { Command } from 'commander';
import type * as Ctx from './context.ts';
import type * as CliApp from './types.ts';

// The concrete implementation of your abstract logic
export class DeclarativeCommand<TCtx extends Ctx.ICtx> {
  public commander: Command;
  name: string;
  node: CliApp.CommandNode<TCtx>;
  parentCtx?: unknown;

  constructor(
    name: string,
    node: CliApp.CommandNode<TCtx>,
    parentCtx?: any,
  ) {
    this.commander = new Command();
    this.name = name;
    this.node = node;
    this.setup();
  }

  private setup() {
    const { node } = this;

    // 1. Metadata
    if (node.description) this.commander.description(node.description);
    if (node.version) this.commander.version(node.version);
    if (node.arguments) this.commander.arguments(node.arguments);

    // 2. Options (Static setup)
    if (typeof node.options === 'object') {
      this.applyOptions(node.options);
    }

    // 3. The Lifecycle Hook (PreAction)
    this.commander.hook('preAction', async (parentCmd, currentCmd) => {
      const opts = currentCmd.opts();
      const args = currentCmd.args;

      // Execute refineContext to create/hydrate the current context level
      // If no refiner exists, we pass the parent context through
      this.node.currentCtx = node.refineContext ? await node.refineContext(this.parentCtx, opts, args) : this.parentCtx;

      // Dynamic Options: if options is a function, we apply it now
      if (typeof node.options === 'function') {
        this.applyOptions(node.options(this.node.currentCtx));
      }
    });

    // 4. Action Execution
    if (node.action) {
      this.commander.action(async (...args) => {
        // We use the context that was refined in the preAction hook
        await node.action!(this.node.currentCtx, this.commander.opts(), ...args);
      });
    } else {
      // Default behavior if no action is defined (e.g. Root command)
      this.commander.action(() => this.commander.help());
    }

    // 5. Recursive Subcommand Registration
    if (node.subCommands) {
      for (const [subName, subConfig] of Object.entries(node.subCommands)) {
        const subInstance = new DeclarativeCommand(subName, subConfig, this.node.currentCtx);
        this.commander.addCommand(subInstance.commander);
      }
    }
  }

  private applyOptions(map: OptionsMap) {
    for (const [flags, desc] of Object.entries(map)) {
      this.commander.option(flags, desc);
    }
  }
}
