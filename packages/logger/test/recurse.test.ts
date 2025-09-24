import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import type * as MsgBuilder from '$msgbuilder';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

describe('Logger Recursion', () => {
  test('should handle recursive logger creation and usage', () => {
    const logMgr = new Log.Mgr<M>();
    const rootLogger = logMgr.getLogger<Log.Std.Logger<M>>();
    logMgr.threshold = 'spam'; // Allow all levels
    
    rootLogger.sid = 'sid1';
    rootLogger.reqId = 'req1';
    rootLogger.pkgs.push('pkg1');

    // Create message builder and test basic functionality
    const mb = rootLogger.info.h1('Test message');
    const str = mb.format({ color: false });
    expect(str).toBe('Test message');

    const obj = mb.emit();
    expect(obj).toBeDefined();
    if (obj) {
      expect(obj.timestamp).toBeInstanceOf(Date);
      expect(obj.formatter).toBeDefined();
    }

    // Test recursive logger creation
    const child1 = rootLogger.getChild({ reqId: 'req2a', pkg: 'pkg2a' });
    const child2 = child1.getChild({ sid: 'sid3', reqId: 'req3', pkg: 'pkg3' });
    
    const mb3 = child2.info.h1('Recursive message');
    const str3 = mb3.format({ color: false });
    expect(str3).toBe('Recursive message');

    const obj3 = mb3.emit();
    expect(obj3).toBeDefined();
    if (obj3) {
      expect(obj3.timestamp).toBeInstanceOf(Date);
      expect(obj3.formatter).toBeDefined();
    }
  });

  test('should maintain logger hierarchy correctly', () => {
    const logMgr = new Log.Mgr<M>();
    const rootLogger = logMgr.getLogger<Log.Std.Logger<M>>();
    logMgr.threshold = 'info';
    
    // Test that child loggers maintain proper hierarchy
    const child1 = rootLogger.getChild({ pkg: 'level1' });
    const child2 = child1.getChild({ pkg: 'level2' });
    const child3 = child2.getChild({ pkg: 'level3' });
    
    expect(child1).toBeDefined();
    expect(child2).toBeDefined();
    expect(child3).toBeDefined();
    
    // Test that deeply nested logger can emit
    const msgBuilder = child3.info.text('Deep nesting test');
    const result = msgBuilder.emit();
    
    expect(result).toBeDefined();
  });
});
