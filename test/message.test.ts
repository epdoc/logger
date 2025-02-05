import { assertEquals, assertInstanceOf, assertLess } from '@std/assert';
import { builder, LogMgr, std } from '../mod.ts';

const logMgr = new LogMgr('std');

Deno.test('test', () => {
  const log: std.Logger = logMgr.getLogger() as std.Logger;
  const msgBuilder = new builder.Console.MsgBuilder('INFO', log.setPackage('testpkg').setThreshold('info'));
  const record = msgBuilder.emit('test');
  assertEquals(record.level, 'INFO');
  assertEquals(record.msg, 'test');
  assertEquals(record.package, 'testpkg');
  assertEquals(record.srcRef, undefined);
  assertInstanceOf(record.timestamp, Date);
  const diff = Math.abs(record.timestamp.getTime() - new Date().getTime());
  assertLess(diff, 10);
});
