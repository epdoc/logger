import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import * as CliffApp from '../src/mod.ts';

// Mock Context
interface MockCtx extends CliffApp.Ctx.ICtx {
  host?: string;
  isRefined?: boolean;
}

const mockCtx: MockCtx = {
  log: {} as unknown as MockCtx['log'],
  logMgr: {
    logLevels: {
      names: ['error', 'warn', 'info', 'debug', 'trace']
    }
  } as unknown as MockCtx['logMgr'],
  dryRun: false,
  pkg: { name: "test", version: "1.0.0", description: "test package" },
  close: () => Promise.resolve(),
};

// Mock Commands
class ChildCmd extends CliffApp.Command<MockCtx> {
  protected override setupCommandOptions(): void {
    this.cmd.description("Child Command");
  }

  protected action(): void {
    // Test action implementation
  }
}

class ParentCmd extends CliffApp.Command<MockCtx> {
  protected override subCommands = {
    child: ChildCmd,
  };

  protected override async deriveChildContext(ctx: MockCtx): Promise<MockCtx> {
    return { ...ctx, isRefined: true };
  }

  protected override setupCommandOptions(): void {
    this.cmd.description("Parent Command");
  }

  protected action(): void {
    // Test action implementation
  }
}

describe("CliffApp.Command", () => {
  it("should instantiate and register subcommands declaratively", async () => {
    const parent = new ParentCmd();
    await parent.setContext(mockCtx);
    await parent.init();

    expect(parent.cmd.getCommands().length).toBe(1);
    expect(parent.cmd.getCommand("child")).toBeDefined();
  });

  it("should propagate context recursively and allow refinement", async () => {
    const parent = new ParentCmd();
    await parent.setContext(mockCtx);
    await parent.init();

    expect(parent.ctx.isRefined).toBe(true);
  });

  it("should throw error if context is accessed before being set", () => {
    const cmd = new ChildCmd();
    expect(() => cmd.ctx).toThrow("Context not set");
  });

  it("should call lifecycle hooks in order", () => {
    let callOrder: string[] = [];
    class HookCmd extends CliffApp.Command<MockCtx> {
      protected override setupOptions() {
        callOrder.push("options");
      }
      protected override configureGlobalHooks() {
        callOrder.push("global");
      }
      protected override setupSubcommands() {
        callOrder.push("sub");
      }
      protected override setupAction() {
        callOrder.push("action");
      }
      protected action(): void {
        // Test action implementation
      }
    }

    const cmd = new HookCmd();
    cmd.init();
    expect(callOrder).toEqual(["options", "global", "sub", "action"]);
  });
});
