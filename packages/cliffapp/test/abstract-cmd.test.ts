import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { AbstractCmd } from "../src/abstract-cmd.ts";
import { ICtx } from "../src/types.ts";

// Mock Context
interface MockCtx extends ICtx {
  host?: string;
  isRefined?: boolean;
}

const mockCtx: MockCtx = {
  log: {} as any,
  logMgr: {} as any,
  dryRun: false,
  // pkg: { name: "test", version: "1.0.0", description: "blah blah" },
  close: () => Promise.resolve(),
};

// Mock Commands
class ChildCmd extends AbstractCmd<MockCtx> {
  protected override setupOptions(): void {
    this.cmd.description("Child Command");
  }
}

class ParentCmd extends AbstractCmd<MockCtx> {
  protected override subCommands = {
    child: ChildCmd,
  };

  protected override refineContext(ctx: MockCtx): MockCtx {
    return { ...ctx, isRefined: true };
  }

  protected override setupOptions(): void {
    this.cmd.description("Parent Command");
  }
}

describe("AbstractCmd", () => {
  it("should instantiate and register subcommands declaratively", () => {
    const parent = new ParentCmd();
    parent.init();

    expect(parent.cmd.getCommands().length).toBe(1);
    expect(parent.cmd.getCommand("child")).toBeDefined();
    // Use any cast to access internal children array for verification
    expect((parent as any).children.length).toBe(1);
    expect((parent as any).children[0]).toBeInstanceOf(ChildCmd);
  });

  it("should propagate context recursively and allow refinement", () => {
    const parent = new ParentCmd();
    parent.init();
    parent.setContext(mockCtx);

    expect(parent.ctx.isRefined).toBe(true);

    const child = (parent as any).children[0] as ChildCmd;
    expect(child.ctx.isRefined).toBe(true);
  });

  it("should throw error if context is accessed before being set", () => {
    const cmd = new ChildCmd();
    expect(() => cmd.ctx).toThrow("Context not set");
  });

  it("should call lifecycle hooks in order", () => {
    let callOrder: string[] = [];
    class HookCmd extends AbstractCmd<MockCtx> {
      protected override setupOptions() {
        callOrder.push("options");
      }
      protected override setupGlobalAction() {
        callOrder.push("global");
      }
      protected override setupSubcommands() {
        callOrder.push("sub");
      }
      protected override setupAction() {
        callOrder.push("action");
      }
    }

    const cmd = new HookCmd();
    cmd.init();
    expect(callOrder).toEqual(["options", "global", "sub", "action"]);
  });
});
