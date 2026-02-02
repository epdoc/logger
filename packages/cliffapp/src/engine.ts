import { ProxyCmd } from './abstract-cmd.ts';
import type { CommandNode, ICtx } from './types.ts';

/**
 * A utility to run a purely declarative command tree.
 */
export class CommandEngine<Ctx extends ICtx> {
  constructor(private initialCtx: Ctx) {}

  async run(node: CommandNode<Ctx>) {
    const proxy = new ProxyCmd(node);
    proxy.setContext(this.initialCtx);
    proxy.init();
    await proxy.cmd.parse(Deno.args);
  }
}
