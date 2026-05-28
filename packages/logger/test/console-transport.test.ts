import * as Log from '../src/mod.ts';
import type { Console } from '@epdoc/msgbuilder';
import * as assert from 'node:assert';

type Logger = Log.Std.Logger<Console.Builder>;

Deno.test('ConsoleTransport', async (t) => {
  await t.step('useStderr option', async (t) => {
    await t.step('should output to console.log by default', async () => {
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

        assert.strictEqual(logCalls.length, 1);
        assert.ok(logCalls[0].includes('stdout message'));
        assert.strictEqual(errorCalls.length, 0);
      } finally {
        console.log = origLog;
        console.error = origError;
        await logMgr.close();
      }
    });

    await t.step('should output to console.error when useStderr is true', async () => {
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

        assert.strictEqual(errorCalls.length, 1);
        assert.ok(errorCalls[0].includes('stderr message'));
        assert.strictEqual(logCalls.length, 0);
      } finally {
        console.log = origLog;
        console.error = origError;
        await logMgr.close();
      }
    });

    await t.step('should not affect other transports on the same logMgr', async () => {
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
        assert.strictEqual(logCalls.length, 1);
        assert.ok(logCalls[0].includes('dual output'));
        assert.strictEqual(errorCalls.length, 1);
        assert.ok(errorCalls[0].includes('dual output'));
      } finally {
        console.log = origLog;
        console.error = origError;
        await logMgr.close();
      }
    });
  });
});
