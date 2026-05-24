import { DateTime } from '@epdoc/datetime';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import * as assert from 'node:assert';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

Deno.test('Logger Nesting', async (t) => {
  await t.step('should create a child logger', async () => {
    const logMgr = new Log.Mgr<M>();
    logMgr.initLevels();
    await logMgr.start();
    const rootLogger = await logMgr.getLogger<Log.Std.Logger<M>>();
    rootLogger.reqId = 'req1';
    rootLogger.pkgs.push('root');

    const childLogger = rootLogger.getChild({ pkg: 'child1' });
    assert.ok(childLogger !== undefined);

    // Test that child logger can create message builders
    const msgBuilder = (childLogger.info as MsgBuilder.Console.Builder).h1('Child message');
    const entry = msgBuilder.emit();

    assert.ok(entry !== undefined);
    if (entry) {
      assert.ok(entry.timestamp instanceof DateTime);
    }
  });

  await t.step('should correctly handle multiple levels of nesting', async () => {
    const logMgr = new Log.Mgr<M>();
    logMgr.initLevels();
    await logMgr.start();
    const rootLogger = await logMgr.getLogger<Log.Std.Logger<M>>();
    rootLogger.reqId = 'req1';
    rootLogger.pkgs.push('root');

    const child1 = rootLogger.getChild({ pkg: 'child1' });
    const child2 = child1.getChild({ reqId: 'req2', pkg: 'child2' });

    assert.ok(child2 !== undefined);

    // Test that deeply nested logger works
    const msgBuilder = (child2.info as MsgBuilder.Console.Builder).h1('Deep child message');
    const entry = msgBuilder.emit();

    assert.ok(entry !== undefined);
    if (entry) {
      assert.ok(entry.timestamp instanceof DateTime);
    }
  });

  await t.step('should overwrite sid in child logger', async () => {
    const logMgr = new Log.Mgr<M>();
    logMgr.initLevels();
    await logMgr.start();
    const rootLogger = await logMgr.getLogger<Log.Std.Logger<M>>();
    logMgr.threshold = 'info';

    rootLogger.sid = 'session1';
    const childLogger = rootLogger.getChild({ sid: 'session2' });

    assert.ok(childLogger !== undefined);
    assert.strictEqual(childLogger.sid, 'session2');
  });

  await t.step('should correctly format the output string', async () => {
    const logMgr = new Log.Mgr<M>();
    logMgr.initLevels();
    await logMgr.start();
    logMgr.threshold = 'spam'; // Allow all levels

    const rootLogger = await logMgr.getLogger<Log.Std.Logger<M>>();
    rootLogger.sid = 'session1';
    rootLogger.reqId = 'req1';
    rootLogger.pkgs.push('root');

    const childLogger = rootLogger.getChild({ pkg: 'child1' });
    const msgBuilder = (childLogger.info as MsgBuilder.Console.Builder).h1('Test message');

    // Test that message can be formatted and emitted
    const formatted = msgBuilder.format({ color: false });
    const entry = msgBuilder.emit();

    assert.strictEqual(formatted, 'Test message');
    assert.ok(entry !== undefined);
  });

  await t.step('pkg chain', async (t) => {
    await t.step('should chain pkg names with default separators', async () => {
      // Test with default separator
      const logMgr = new Log.Mgr<M>();
      logMgr.initLevels();
      const bufferTransport = new Log.Transport.Buffer.Transport(logMgr);
      logMgr.addTransport(bufferTransport);
      await logMgr.start();
      const bufferTransport2 = new Log.Transport.Buffer.Transport(logMgr);
      logMgr.addTransport(bufferTransport2);
      const rootLogger = await logMgr.getLogger<Log.Std.Logger<M>>({ pkg: 'root' });
      const childLogger = rootLogger.getChild({ pkg: 'child' });
      const grandChildLogger = childLogger.getChild({ pkg: 'grandchild' });

      grandChildLogger.info.text('test').emit();
      const capturedEntries = bufferTransport.getEntries();
      assert.strictEqual(capturedEntries.length, 2);
      // First message: warning from LogMgr (no pkg field)
      assert.strictEqual(capturedEntries[0].pkg, undefined);
      assert.ok(capturedEntries[0].msg!.includes('Log Manager is already running.'));
      // Second message: from grandchild logger
      assert.strictEqual(capturedEntries[1].pkg, 'root.child.grandchild');
      assert.strictEqual(capturedEntries[1].msg, 'test');

      const capturedEntries2 = bufferTransport2.getEntries();
      assert.strictEqual(capturedEntries2.length, 1);
      // Only the test message (added after warning was emitted)
      assert.strictEqual(capturedEntries2[0].msg, 'test');
      assert.strictEqual(capturedEntries2[0].pkg, 'root.child.grandchild');
    });

    await t.step('should chain pkg names with custom separators', async () => {
      // Test with custom separator
      const logMgr = new Log.Mgr<M>({ show: { pkgSep: '->' } });
      logMgr.initLevels();
      const bufferTransport = new Log.Transport.Buffer.Transport(logMgr);
      logMgr.addTransport(bufferTransport);
      await logMgr.start();
      const rootLogger = await logMgr.getLogger<Log.Std.Logger<M>>({ pkg: 'root' });
      const childLogger = rootLogger.getChild({ pkg: 'child' });
      const grandChildLogger = childLogger.getChild({ pkg: 'grandchild' });

      grandChildLogger.info.text('test').emit();
      const capturedEntry = bufferTransport.getLastEntry();
      assert.strictEqual(capturedEntry?.pkg, 'root->child->grandchild');
    });
  });
});
