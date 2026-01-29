import { Command } from "@cliffy/command";
import { Mgr as LogManager } from "@epdoc/logger";
import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { addLoggingOptions, configureLogging } from "../src/logging.ts";
import { run, } from "../src/run.ts";
import { SilentError } from "../src/silent-error.ts";
import type { ICtx, Logger } from "../src/types.ts";

describe("cliffapp", () => {
  const createCtx = async (): Promise<ICtx> => {
    const logMgr = new LogManager();
    const log = await logMgr.getLogger<Logger>({ pkg: "test" });
    return {
      log,
      logMgr: logMgr,
      dryRun: false,
      pkg: { name: "test-app", version: "1.0.0" },
      close: () => Promise.resolve(),
    };
  };

  describe("SilentError", () => {
    it("should have silent property set to true", () => {
      const err = new SilentError("test message");
      expect(err.silent).toBe(true);
      expect(err.message).toBe("test message");
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe("addLoggingOptions", () => {
    it("should add standard options to command", async () => {
      const ctx = await createCtx();
      const cmd = new Command();
      addLoggingOptions(cmd, ctx);

      // We use noExit() to prevent the test from exiting on parse errors
      // and cast the result to any to access options easily in tests.
      // deno-lint-ignore no-explicit-any
      const result: any = await cmd.noExit().parse(["--log", "debug", "--verbose"]);
      const options = result.options;
      
      expect(options).toHaveProperty("log");
      expect(options.log).toBe("debug");
      expect(options).toHaveProperty("verbose");
      expect(options.verbose).toBe(true);
    });
  });

  describe("configureLogging", () => {
    it("should set threshold correctly using log level names", async () => {
      const ctx = await createCtx();
      
      configureLogging(ctx, { verbose: true });
      expect(ctx.logMgr.logLevels.asName(ctx.logMgr.threshold).toLowerCase()).toBe("verbose");
      
      configureLogging(ctx, { debug: true });
      expect(ctx.logMgr.logLevels.asName(ctx.logMgr.threshold).toLowerCase()).toBe("debug");
      
      configureLogging(ctx, { log: "warn" });
      expect(ctx.logMgr.logLevels.asName(ctx.logMgr.threshold).toLowerCase()).toBe("warn");
    });

    it("should set dryRun to true when --dry-run is used", async () => {
      const ctx = await createCtx();
      configureLogging(ctx, { dryRun: true });
      expect(ctx.dryRun).toBe(true);
    });

    it("should throw error on conflicting options", async () => {
      const ctx = await createCtx();
      expect(() => {
        configureLogging(ctx, { verbose: true, debug: true });
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
      const cmd = new Command().action(() => {}).noExit();

      await run(ctx, cmd, [], { noExit: true });
      expect(closed).toBe(true);
    });

    it("should configure logging during run", async () => {
      const ctx = await createCtx();
      const cmd = new Command().noExit();
      addLoggingOptions(cmd, ctx);
      cmd.action(() => {});

      await run(ctx, cmd, ["--debug"], { noExit: true });
      expect(ctx.logMgr.logLevels.asName(ctx.logMgr.threshold).toLowerCase()).toBe("debug");
    });
  });
});
