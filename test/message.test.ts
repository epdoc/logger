import { isDate } from '@epdoc/type';
import { expect } from 'jsr:@std/expect';
import { describe, test } from 'jsr:@std/testing/bdd';
import { Log } from '../mod.ts';

const logMgr = new Log.Mgr('std');

describe('Log.Entity', () => {
  test('test', () => {
    const log: Log.std.Logger = logMgr.getLogger() as Log.std.Logger;
    const msgBuilder = new Log.MsgBuilder.Console('INFO', log.setPackage('testpkg').setThreshold('info'));
    const record = msgBuilder.emit('test');
    expect(record.level).toBe('INFO');
    expect(record.msg).toBe('test');
    expect(record.package).toBe('testpkg');
    expect(record.timestamp).toBeInstanceOf(Date);
    if (isDate(record.timestamp)) {
      const diff = Math.abs(record.timestamp.getTime() - new Date().getTime());
      expect(diff).toBeLessThan(10);
    }
  });
});
