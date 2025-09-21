import { isDate } from '@epdoc/type';
import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import * as MsgBuilder from '$msgbuilder';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

const logMgr = new Log.Mgr<M>();

describe('Log.Entity', () => {
  test('test', () => {
    const log: Log.Std.Logger<M> = logMgr.getLogger() as Log.Std.Logger<M>;
    log.pkgs.push('testpkg');
    log.threshold = 'info';
    const msgBuilder = new MsgBuilder.Console.Builder('INFO', log);
    msgBuilder.h1('message heading');
    const str = msgBuilder.format(false);
    const record = msgBuilder.emit('parameter passed to emit');
    expect(record).toBeDefined();
    if (record) {
      expect(record.level).toBe('INFO');
      expect(record.msg).toBeInstanceOf(MsgBuilder.Console.Builder);
      expect(record.pkgs).toEqual(['testpkg']);
      expect(record.reqIds).toBeUndefined();
      expect(record.timestamp).toBeInstanceOf(Date);
      if (isDate(record.timestamp)) {
        const diff = Math.abs(record.timestamp.getTime() - new Date().getTime());
        expect(diff).toBeLessThan(10);
      }
    }
    expect(str).toEqual('message heading');
  });
});
