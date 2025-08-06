import { expect } from 'jsr:@std/expect';
import { describe, test } from 'jsr:@std/testing/bdd';
import * as Log from '../mod.ts';

type M = Log.MsgBuilder.Console.Builder;
type LStd = Log.Std.Logger<M>;
type LCli = Log.Cli.Logger<M>;

describe('Logger Nesting', () => {
  test('should correctly handle a single level of nesting', () => {
    const logMgr = new Log.Mgr<M>();
    const rootLogger = logMgr.getLogger<LStd>();
    logMgr.threshold = 'spam';
    rootLogger.pkgs.push('root');
    const childLogger = rootLogger.getChild({ sid: 'session1', reqId: 'req1', pkg: 'child1' }); // as Log.Std.Logger<M>;

    const entry = childLogger.info.h1('Test message').emit();
    expect(entry).toBeDefined();
    if (entry) {
      expect(entry.sid).toEqual('session1');
      expect(entry.reqIds).toEqual(['req1']);
      expect(entry.pkgs).toEqual(['root', 'child1']);
    }
  });

  test('should correctly handle multiple levels of nesting', () => {
    const logMgr = new Log.Mgr<M>({ show: { reqIdSep: '/', pkgSep: ':' } }).init();
    logMgr.threshold = 'spam';
    const rootLogger = logMgr.getLogger() as Log.Std.Logger<M>;
    rootLogger.pkgs.push('root');
    const childLogger = rootLogger.getChild({ sid: 'session1', reqId: 'req1', pkg: 'child1' }); // as Log.Std.Logger<M>;
    const grandChildLogger = childLogger.getChild({ reqId: 'req2', pkg: 'child2' }); // as Log.Std.Logger<M>;

    const entry = grandChildLogger.info.h1('Test message').emit();
    expect(entry).toBeDefined();
    if (entry) {
      expect(entry.sid).toEqual('session1');
      expect(entry.reqIds).toEqual(['req1', 'req2']);
      expect(entry.pkgs).toEqual(['root', 'child1', 'child2']);
    }
  });

  test('should overwrite sid in child logger', () => {
    const logMgr = new Log.Mgr<M>();
    const rootLogger = logMgr.getLogger<Log.Std.Logger<M>>();
    logMgr.threshold = 'spam';
    rootLogger.sid = 'session1';
    const childLogger = rootLogger.getChild({ sid: 'session2' });

    const entry = childLogger.info.h1('Test message').emit();
    expect(entry).toBeDefined();
    if (entry) {
      expect(entry.sid).toBe('session2');
    }
  });

  test('should correctly format the output string', () => {
    const logMgr = new Log.Mgr<M>({ show: { level: true, pkg: true, sid: true, reqId: true, pkgSep: '/' } }).init();
    logMgr.threshold = 'spam';
    const rootLogger = logMgr.getLogger<Log.Std.Logger<M>>();
    rootLogger.pkgs.push('root');
    const childLogger = rootLogger.getChild({ sid: 'session1', reqId: 'req1', pkg: 'child1' }); // as Log.Std.Logger<M>;

    let output = '';
    const originalLog = console.log;
    console.log = (msg: string) => {
      output = msg;
    };

    const transport = new Log.Transport.Console.Transport(logMgr);
    logMgr.transportMgr.add(transport);

    childLogger.info.h1('Test message').emit();

    console.log = originalLog;

    expect(output).toContain('[INFO ]');
    expect(output).toContain(['root/child1']);
    expect(output).toContain('session1');
    expect(output).toContain('req1');
    expect(output).toContain('Test message');
  });
});
