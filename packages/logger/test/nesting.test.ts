import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import type * as MsgBuilder from '$msgbuilder';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

describe('Logger Nesting', () => {
  test('should create a child logger', async () => {
    const logMgr = new Log.Mgr<M>();
    logMgr.init();
    await logMgr.start();
    const rootLogger = logMgr.getLogger<Log.Std.Logger<M>>();
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
    logMgr.init();
    await logMgr.start();
    const rootLogger = logMgr.getLogger<Log.Std.Logger<M>>();
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
    logMgr.init();
    await logMgr.start();
    const rootLogger = logMgr.getLogger<Log.Std.Logger<M>>();
    logMgr.threshold = 'info';
    
    rootLogger.sid = 'session1';
    const childLogger = rootLogger.getChild({ sid: 'session2' });
    
    expect(childLogger).toBeDefined();
    expect(childLogger.sid).toBe('session2');
  });

  test('should correctly format the output string', async () => {
    const logMgr = new Log.Mgr<M>();
    logMgr.init();
    await logMgr.start();
    logMgr.threshold = 'spam'; // Allow all levels
    
    const rootLogger = logMgr.getLogger<Log.Std.Logger<M>>();
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

  test('should chain pkg names with default and custom separators', async () => {
    // Test with default separator
    const logMgr = new Log.Mgr<M>();
    logMgr.init();
    await logMgr.start();
    logMgr.removeTransport(logMgr.transportMgr.transports[0]);
    const rootLogger = logMgr.getLogger<Log.Std.Logger<M>>({ pkg: 'root' });
    const childLogger = rootLogger.getChild({ pkg: 'child' });
    const grandChildLogger = childLogger.getChild({ pkg: 'grandchild' });

    let capturedEntry: Log.Entry | undefined;
    const mockTransport = {
      emit: (entry: Log.Entry) => {
        capturedEntry = entry;
      },
      getOptions: () => { return {}; },
      meetsThresholdValue: () => { return true; }
    };
    logMgr.addTransport(mockTransport as any);

    (grandChildLogger.info as MsgBuilder.Console.Builder).text('test').emit();
    expect(capturedEntry?.pkg).toBe('root.child.grandchild');

    // Test with custom separator
    const logMgr2 = new Log.Mgr<M>({ show: { pkgSep: '->' } });
    logMgr2.init();
    await logMgr2.start();
    logMgr2.removeTransport(logMgr2.transportMgr.transports[0]);
    const rootLogger2 = logMgr2.getLogger<Log.Std.Logger<M>>({ pkg: 'root' });
    const childLogger2 = rootLogger2.getChild({ pkg: 'child' });
    const grandChildLogger2 = childLogger2.getChild({ pkg: 'grandchild' });

    let capturedEntry2: Log.Entry | undefined;
    const mockTransport2 = {
      emit: (entry: Log.Entry) => {
        capturedEntry2 = entry;
      },
      getOptions: () => { return {}; },
      meetsThresholdValue: () => { return true; }
    };
    logMgr2.addTransport(mockTransport2 as any);

    (grandChildLogger2.info as MsgBuilder.Console.Builder).text('test').emit();
    expect(capturedEntry2?.pkg).toBe('root->child->grandchild');
  });
});
