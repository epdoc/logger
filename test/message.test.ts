import { assertEquals, assertInstanceOf, assertLess } from '@std/assert';
import { Log } from '../mod.ts';

const logMgr = new Log.Mgr('std');

Deno.test('test', () => {
  const log: Log.std.Logger = logMgr.getLogger() as Log.std.Logger;
  const msgBuilder = new Log.MsgBuilder.Console('INFO', log.setPackage('testpkg').setThreshold('info'));
  const record = msgBuilder.emit('test');
  assertEquals(record.level, 'INFO');
  assertEquals(record.msg, 'test');
  assertEquals(record.package, 'testpkg');
  assertInstanceOf(record.timestamp, Date);
  const diff = Math.abs(record.timestamp.getTime() - new Date().getTime());
  assertLess(diff, 10);
});
