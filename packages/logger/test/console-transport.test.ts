import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

type Logger = Log.Std.Logger<Console.Builder>;

describe('ConsoleTransport', () => {
  describe('useStderr option', () => {
    it('should output to console.log by default', async () => {
      const logMgr = new Log.Mgr<Console.Builder>();
      logMgr.initLevels();
      logMgr.threshold = 'info';
      const transport = new Log.Transport.Console.Transport(logMgr, { color: false });
      await logMgr.addTransport(transport);

      const logger = await logMgr.getLogger<Logger>();

      const logCalls: string[] = [];
      const errorCalls: string[] = [];
      const origLog = console.log;
      const origError = console.error;
      console.log = (...args: unknown[]) => logCalls.push(String(args[0]));
      console.error = (...args: unknown[]) => errorCalls.push(String(args[0]));

      try {
        logger.info.text('stdout message').emit();

        expect(logCalls.length).toBe(1);
        expect(logCalls[0]).toContain('stdout message');
        expect(errorCalls.length).toBe(0);
      } finally {
        console.log = origLog;
        console.error = origError;
        await logMgr.close();
      }
    });

    it('should output to console.error when useStderr is true', async () => {
      const logMgr = new Log.Mgr<Console.Builder>();
      logMgr.initLevels();
      logMgr.threshold = 'info';
      const transport = new Log.Transport.Console.Transport(logMgr, { color: false, useStderr: true });
      await logMgr.addTransport(transport);

      const logger = await logMgr.getLogger<Logger>();

      const logCalls: string[] = [];
      const errorCalls: string[] = [];
      const origLog = console.log;
      const origError = console.error;
      console.log = (...args: unknown[]) => logCalls.push(String(args[0]));
      console.error = (...args: unknown[]) => errorCalls.push(String(args[0]));

      try {
        logger.info.text('stderr message').emit();

        expect(errorCalls.length).toBe(1);
        expect(errorCalls[0]).toContain('stderr message');
        expect(logCalls.length).toBe(0);
      } finally {
        console.log = origLog;
        console.error = origError;
        await logMgr.close();
      }
    });

    it('should not affect other transports on the same logMgr', async () => {
      const logMgr = new Log.Mgr<Console.Builder>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const stderrTransport = new Log.Transport.Console.Transport(logMgr, { color: false, useStderr: true });
      await logMgr.addTransport(stderrTransport);

      const stdoutTransport = new Log.Transport.Console.Transport(logMgr, { color: false });
      await logMgr.addTransport(stdoutTransport);

      const logger = await logMgr.getLogger<Logger>();

      const logCalls: string[] = [];
      const errorCalls: string[] = [];
      const origLog = console.log;
      const origError = console.error;
      console.log = (...args: unknown[]) => logCalls.push(String(args[0]));
      console.error = (...args: unknown[]) => errorCalls.push(String(args[0]));

      try {
        logger.info.text('dual output').emit();

        // Message should appear on both transports
        expect(logCalls.length).toBe(1);
        expect(logCalls[0]).toContain('dual output');
        expect(errorCalls.length).toBe(1);
        expect(errorCalls[0]).toContain('dual output');
      } finally {
        console.log = origLog;
        console.error = origError;
        await logMgr.close();
      }
    });
  });
});
