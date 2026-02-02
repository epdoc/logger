import { Command as CliffyCommand } from "@cliffy/command";
import { Mgr as LogManager } from "@epdoc/logger";
import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import * as CliffApp from '../src/mod.ts';

describe("cliffapp", () => {
  const createCtx = async (): Promise<CliffApp.ICtx> => {
    const logMgr = new LogManager();
    const log = await logMgr.getLogger<CliffApp.Logger>({ pkg: "test" });
    return {
      log,
      logMgr: logMgr,
      dryRun: false,
      pkg: { name: "test-app", version: "1.0.0", description: "test app" },
      close: () => Promise.resolve(),
    };
  };

  describe("SilentError", () => {
    it("should have silent property set to true", () => {
      const err = new CliffApp.SilentError("test message");
      expect(err.silent).toBe(true);
      expect(err.message).toBe("test message");
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe("addLoggingOptions", () => {
    it("should add standard options to command", async () => {
      const ctx = await createCtx();
      const cmd = new CliffyCommand();
      CliffApp.addLoggingOptions(cmd, ctx);

      // We use noExit() to prevent the test from exiting on parse errors
      // and cast the result to any to access options easily in tests.
      // deno-lint-ignore no-explicit-any
      const result: any = await cmd.noExit().parse(["--log-level", "DEBUG", "--verbose"]);
      const options = result.options;
      
      expect(options).toHaveProperty("logLevel");
      expect(options.logLevel).toBe("DEBUG");
      expect(options).toHaveProperty("verbose");
      expect(options.verbose).toBe(true);
    });
  });

  describe("configureLogging", () => {
    it("should set threshold correctly using log level names", async () => {
      const ctx = await createCtx();
      
      CliffApp.configureLogging(ctx, { verbose: true });
      expect(ctx.logMgr.logLevels.asName(ctx.logMgr.threshold).toLowerCase()).toBe("verbose");
      
      CliffApp.configureLogging(ctx, { debug: true });
      expect(ctx.logMgr.logLevels.asName(ctx.logMgr.threshold).toLowerCase()).toBe("debug");
      
      CliffApp.configureLogging(ctx, { logLevel: "warn" });
      expect(ctx.logMgr.logLevels.asName(ctx.logMgr.threshold).toLowerCase()).toBe("warn");
    });

    it("should set dryRun to true when --dry-run is used", async () => {
      const ctx = await createCtx();
      CliffApp.configureLogging(ctx, { dryRun: true });
      expect(ctx.dryRun).toBe(true);
    });

    it("should throw error on conflicting options", async () => {
      const ctx = await createCtx();
      expect(() => {
        CliffApp.configureLogging(ctx, { verbose: true, debug: true });
      }).toThrow("Conflicting command line options");
    });
  });

  describe("run", () => {
    it("should call close on finally", async () => {
      let closed = false;
      const ctx = await createCtx();
      ctx.close = () => {
        closed = true;
        return Promise.resolve();
      };
      const cmd = new CliffyCommand().action(() => {}).noExit();

      await CliffApp.run(ctx, cmd, [], { noExit: true });
      expect(closed).toBe(true);
    });

    it("should configure logging during run", async () => {
      const ctx = await createCtx();
      const cmd = new CliffyCommand().noExit();
      CliffApp.addLoggingOptions(cmd, ctx);
      cmd.action(() => {});

      await CliffApp.run(ctx, cmd, ["--debug"], { noExit: true });
      expect(ctx.logMgr.logLevels.asName(ctx.logMgr.threshold).toLowerCase()).toBe("debug");
    });
  });
});
