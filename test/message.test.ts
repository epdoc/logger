import { isDate } from '@epdoc/type';
import { expect } from 'jsr:@std/expect';
import { describe, test } from 'jsr:@std/testing/bdd';
import { Log } from '../mod.ts';

type M = Log.MsgBuilder.Console;

const logMgr = new Log.Mgr<M>();

describe('Log.Entity', () => {
  test('test', () => {
    const log: Log.std.Logger<M> = logMgr.getLogger() as Log.std.Logger<M>;
    log.setPackage('testpkg').setThreshold('info');
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log, log);
    msgBuilder.h1('message heading');
    const str = msgBuilder.format(false);
    const record = msgBuilder.emit('parameter passed to emit');
    expect(record).toBeDefined();
    if (record) {
      expect(record.level).toBe('INFO');
      expect(record.msg).toBeInstanceOf(Log.MsgBuilder.Console);
      expect(record.package).toBe('testpkg');
      expect(record.timestamp).toBeInstanceOf(Date);
      if (isDate(record.timestamp)) {
        const diff = Math.abs(record.timestamp.getTime() - new Date().getTime());
        expect(diff).toBeLessThan(10);
      }
    }
    expect(str).toEqual('message heading');
  });
});
