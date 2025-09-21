import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import type * as MsgBuilder from '$msgbuilder';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

describe('Logger Nesting', () => {
  test('should correctly handle a single level of nesting', () => {
    const logMgr = new Log.Mgr<M>();
    const rootLogger = logMgr.getLogger<Log.Std.Logger<M>>();
    logMgr.threshold = 'info';
    
    rootLogger.sid = 'session1';
    rootLogger.reqIds.push('req1');
    rootLogger.pkgs.push('root');

    const childLogger = rootLogger.getChild({ pkg: 'child1' });
    expect(childLogger).toBeDefined();
    
    // Test that child logger can create message builders
    const msgBuilder = childLogger.info.h1('Child message');
    const entry = msgBuilder.emit();
    
    expect(entry).toBeDefined();
    if (entry) {
      expect(entry.timestamp).toBeInstanceOf(Date);
    }
  });

  test('should correctly handle multiple levels of nesting', () => {
    const logMgr = new Log.Mgr<M>();
    const rootLogger = logMgr.getLogger<Log.Std.Logger<M>>();
    logMgr.threshold = 'info';
    
    rootLogger.sid = 'session1';
    rootLogger.reqIds.push('req1');
    rootLogger.pkgs.push('root');

    const child1 = rootLogger.getChild({ pkg: 'child1' });
    const child2 = child1.getChild({ reqId: 'req2', pkg: 'child2' });
    
    expect(child2).toBeDefined();
    
    // Test that deeply nested logger works
    const msgBuilder = child2.info.h1('Deep child message');
    const entry = msgBuilder.emit();
    
    expect(entry).toBeDefined();
    if (entry) {
      expect(entry.timestamp).toBeInstanceOf(Date);
    }
  });

  test('should overwrite sid in child logger', () => {
    const logMgr = new Log.Mgr<M>();
    const rootLogger = logMgr.getLogger<Log.Std.Logger<M>>();
    logMgr.threshold = 'info';
    
    rootLogger.sid = 'session1';
    const childLogger = rootLogger.getChild({ sid: 'session2' });
    
    expect(childLogger).toBeDefined();
    expect(childLogger.sid).toBe('session2');
  });

  test('should correctly format the output string', () => {
    const logMgr = new Log.Mgr<M>();
    logMgr.threshold = 'spam'; // Allow all levels
    
    const rootLogger = logMgr.getLogger<Log.Std.Logger<M>>();
    rootLogger.sid = 'session1';
    rootLogger.reqIds.push('req1');
    rootLogger.pkgs.push('root');

    const childLogger = rootLogger.getChild({ pkg: 'child1' });
    const msgBuilder = childLogger.info.h1('Test message');
    
    // Test that message can be formatted and emitted
    const formatted = msgBuilder.format({ color: false });
    const entry = msgBuilder.emit();
    
    expect(formatted).toBe('Test message');
    expect(entry).toBeDefined();
  });
});
