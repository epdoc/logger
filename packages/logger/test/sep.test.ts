import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import * as assert from 'node:assert';
import { BufferTransport } from '../src/transports/buffer/transport.ts';

type Logger = Log.Std.Logger<Console.Builder>;

Deno.test('msgSep - message part separator', async (t) => {
  await t.step('should default to single space between message parts', async () => {
    const logMgr = new Log.Mgr<Console.Builder>();
    logMgr.initLevels();
    logMgr.threshold = 'info';
    const buffer = new BufferTransport(logMgr);
    await logMgr.addTransport(buffer);

    const logger = await logMgr.getLogger<Logger>();
    logger.info.text('Hello').text('World').emit();

    const entries = buffer.getEntries();
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].msg, 'Hello World');
  });

  await t.step('should use logger.sep(0) for zero-width separator', async () => {
    const logMgr = new Log.Mgr<Console.Builder>();
    logMgr.initLevels();
    logMgr.threshold = 'info';
    const buffer = new BufferTransport(logMgr);
    await logMgr.addTransport(buffer);

    const logger = await logMgr.getLogger<Logger>();
    logger.sep(0);
    logger.info.text('Hello').text('World').emit();

    const entries = buffer.getEntries();
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].msg, 'HelloWorld');
  });

  await t.step('should use logger.sep(5) for 5-space separator', async () => {
    const logMgr = new Log.Mgr<Console.Builder>();
    logMgr.initLevels();
    logMgr.threshold = 'info';
    const buffer = new BufferTransport(logMgr);
    await logMgr.addTransport(buffer);

    const logger = await logMgr.getLogger<Logger>();
    logger.sep(5);
    logger.info.text('Hello').text('World').emit();

    const entries = buffer.getEntries();
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].msg, 'Hello     World');
  });

  await t.step('should use show.msgSep as default for all loggers', async () => {
    const logMgr = new Log.Mgr<Console.Builder>();
    logMgr.initLevels();
    logMgr.threshold = 'info';
    logMgr.show = { msgSep: 3 };
    const buffer = new BufferTransport(logMgr);
    await logMgr.addTransport(buffer);

    const logger = await logMgr.getLogger<Logger>();
    logger.info.text('Hello').text('World').emit();

    const entries = buffer.getEntries();
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].msg, 'Hello   World');
  });

  await t.step('should allow logger.sep() to override show.msgSep', async () => {
    const logMgr = new Log.Mgr<Console.Builder>();
    logMgr.initLevels();
    logMgr.threshold = 'info';
    logMgr.show = { msgSep: 3 };
    const buffer = new BufferTransport(logMgr);
    await logMgr.addTransport(buffer);

    const logger = await logMgr.getLogger<Logger>();
    logger.sep(0);
    logger.info.text('Hello').text('World').emit();

    const entries = buffer.getEntries();
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].msg, 'HelloWorld');
  });

  await t.step('should reset to show default when sep() called with no argument', async () => {
    const logMgr = new Log.Mgr<Console.Builder>();
    logMgr.initLevels();
    logMgr.threshold = 'info';
    logMgr.show = { msgSep: 3 };
    const buffer = new BufferTransport(logMgr);
    await logMgr.addTransport(buffer);

    const logger = await logMgr.getLogger<Logger>();

    // Set override
    logger.sep(0);
    logger.info.text('A').text('B').emit();
    assert.strictEqual(buffer.getEntries()[0].msg, 'AB');

    // Reset to show default
    logger.sep();
    logger.info.text('C').text('D').emit();
    assert.strictEqual(buffer.getEntries()[1].msg, 'C   D');
  });

  await t.step('should apply msgSep to label/value chains', async () => {
    const logMgr = new Log.Mgr<Console.Builder>();
    logMgr.initLevels();
    logMgr.threshold = 'info';
    const buffer = new BufferTransport(logMgr);
    await logMgr.addTransport(buffer);

    const logger = await logMgr.getLogger<Logger>();
    logger.sep(3);
    logger.info.label('Count:').value(42).label('Status:').value('ok').emit();

    const entries = buffer.getEntries();
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].msg, 'Count:   42   Status:   ok');
  });
});

Deno.test('columnSep - transport column separator', async (t) => {
  await t.step('should default to single space between columns', async () => {
    const logMgr = new Log.Mgr<Console.Builder>();
    logMgr.initLevels();
    logMgr.threshold = 'info';
    logMgr.show = { level: true };
    const transport = new Log.Transport.Console.Transport(logMgr, { color: false });
    await logMgr.addTransport(transport);

    const logger = await logMgr.getLogger<Logger>();

    const logCalls: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logCalls.push(String(args[0]));

    try {
      logger.info.text('Hello').emit();
      assert.strictEqual(logCalls.length, 1);
      // Level and message separated by single space
      assert.ok(logCalls[0].includes('[INFO ] Hello'));
    } finally {
      console.log = origLog;
      await logMgr.close();
    }
  });

  await t.step('should use show.columnSep for column separation', async () => {
    const logMgr = new Log.Mgr<Console.Builder>();
    logMgr.initLevels();
    logMgr.threshold = 'info';
    logMgr.show = { level: true, columnSep: ' | ' };
    const transport = new Log.Transport.Console.Transport(logMgr, { color: false });
    await logMgr.addTransport(transport);

    const logger = await logMgr.getLogger<Logger>();

    const logCalls: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => logCalls.push(String(args[0]));

    try {
      logger.info.text('Hello').emit();
      assert.strictEqual(logCalls.length, 1);
      // Level and message separated by ' | '
      assert.ok(logCalls[0].includes('[INFO ] | Hello'));
    } finally {
      console.log = origLog;
      await logMgr.close();
    }
  });
});
