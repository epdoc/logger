import { expect } from 'jsr:@std/expect';
import { describe, test } from 'jsr:@std/testing/bdd';
import { Log } from '../mod.ts';

type M = Log.MsgBuilder.Console.Builder;
const logMgr = new Log.Mgr<M>();
logMgr.threshold = 'spam';
logMgr.show = { level: true, timestamp: 'elapsed', pkg: true, sid: true, reqId: true, data: true };

// function testOutput(log:Log.Std.Logger,{}) {
//   log.info.h1()

// }

describe('recurse', () => {
  test('logger assert', () => {
    const log1 = logMgr.getLogger() as Log.Std.Logger<M>;
    const mark = log1.mark();
    log1.setPackage('pkg1');
    log1.reqId = 'req1';
    log1.sid = 'sid1';
    const mb = log1.info.h1('log1').label('label').value('info');
    const str = mb.format(false);
    expect(str).toBe('log1 label info');
    const obj = mb.ewt(mark, true);
    expect(obj).toBeDefined();
    if (obj) {
      expect(obj.level).toBe('INFO');
      expect(obj.sid).toBe('sid1');
      expect(obj.reqIds).toBe('req1');
      expect(obj.pkgs).toBe('pkg1');
      expect(obj.msg).toBeInstanceOf(Log.MsgBuilder.Console.Builder);
    }
    const log2a = log1.getChild({ reqId: ['req2a'], pkg: ['pkg2a'], sid: 'sid2a' }) as Log.Std.Logger<M>;
    log2a.info.h1('log2a').label('label').value('info').emit();
    const log3 = log2a.getChild({ reqId: ['req3'], pkg: ['pkg3'], sid: 'sid3' }) as Log.Std.Logger<M>;
    log3.info.h1('log3').label('label').value('info').emit();
    log3.warn.h1('header').emit('silly level');
    const log2b = log1.getChild({ reqId: ['req2b'], pkg: ['pkg2b'], sid: 'sid2b' }) as Log.Std.Logger<M>;
    log1.info.h1('log1').label('label').value('info').ewt(mark, true);
    const mb3 = log3.info.h1('log3').label('label').value('info');
    const str3 = mb3.format(false);
    expect(str3).toBe('log3 label info');
    const obj3 = mb3.emit();
    expect(obj3).toBeDefined();
    if (obj3) {
      expect(obj3.level).toBe('INFO');
      expect(obj3.sid).toBe('sid3');
      expect(obj3.reqIds).toBe('req1.req2a.req3');
      expect(obj3.pkgs).toBe('pkg1.pkg2a.pkg3');
      expect(obj3.msg).toBeInstanceOf(Log.MsgBuilder.Console.Builder);
    }
    log2b.info.h1('log2b').label('label').value('info').emit();
    log2b.error.error('log2b').label('label').value('info').emit();
    log2b.verbose.error('log2b').value('verbose level').emit('test');
  });
});
