import type * as MsgBuilder from '@epdoc/msgbuilder';
import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

describe('Logger Nesting', () => {
  test('should create a child logger', async () => {
    const logMgr = new Log.Mgr<M>();
    logMgr.initLevels();
    await logMgr.start();
    const rootLogger = await logMgr.getLogger<Log.Std.Logger<M>>();
    rootLogger.reqId = 'req1';
    rootLogger.pkgs.push('root');

    const childLogger = rootLogger.getChild({ pkg: 'child1' });
    expect(childLogger).toBeDefined();

    // Test that child logger can create message builders
    const msgBuilder = (childLogger.info as MsgBuilder.Console.Builder).h1('Child message');
    const entry = msgBuilder.emit();

    expect(entry).toBeDefined();
    if (entry) {
      expect(entry.timestamp).toBeInstanceOf(Date);
    }
  });

  test('should correctly handle multiple levels of nesting', async () => {
    const logMgr = new Log.Mgr<M>();
    logMgr.initLevels();
    await logMgr.start();
    const rootLogger = await logMgr.getLogger<Log.Std.Logger<M>>();
    rootLogger.reqId = 'req1';
    rootLogger.pkgs.push('root');

    const child1 = rootLogger.getChild({ pkg: 'child1' });
    const child2 = child1.getChild({ reqId: 'req2', pkg: 'child2' });

    expect(child2).toBeDefined();

    // Test that deeply nested logger works
    const msgBuilder = (child2.info as MsgBuilder.Console.Builder).h1('Deep child message');
    const entry = msgBuilder.emit();

    expect(entry).toBeDefined();
    if (entry) {
      expect(entry.timestamp).toBeInstanceOf(Date);
    }
  });

  test('should overwrite sid in child logger', async () => {
    const logMgr = new Log.Mgr<M>();
    logMgr.initLevels();
    await logMgr.start();
    const rootLogger = await logMgr.getLogger<Log.Std.Logger<M>>();
    logMgr.threshold = 'info';

    rootLogger.sid = 'session1';
    const childLogger = rootLogger.getChild({ sid: 'session2' });

    expect(childLogger).toBeDefined();
    expect(childLogger.sid).toBe('session2');
  });

  test('should correctly format the output string', async () => {
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

    expect(formatted).toBe('Test message');
    expect(entry).toBeDefined();
  });

  describe('pkg chain', () => {
    test('should chain pkg names with default separators', async () => {
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
      expect(capturedEntries.length).toBe(2);
      // First message: warning from LogMgr (no pkg field)
      expect(capturedEntries[0].pkg).toBeUndefined();
      expect(capturedEntries[0].msg).toContain('Log Manager is already running.');
      // Second message: from grandchild logger
      expect(capturedEntries[1].pkg).toBe('root.child.grandchild');
      expect(capturedEntries[1].msg).toBe('test');

      const capturedEntries2 = bufferTransport2.getEntries();
      expect(capturedEntries2.length).toBe(1);
      // Only the test message (added after warning was emitted)
      expect(capturedEntries2[0].msg).toBe('test');
      expect(capturedEntries2[0].pkg).toBe('root.child.grandchild');
    });

    test('should chain pkg names with custom separators', async () => {
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
      expect(capturedEntry?.pkg).toBe('root->child->grandchild');
    });
  });
});
