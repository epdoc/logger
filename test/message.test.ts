import { assertEquals } from '@std/assert';
import { builder, LogMgr, std } from '../mod.ts';

const logMgr = new LogMgr('std');

Deno.test('test', () => {
  const log: std.Logger = logMgr.getLogger() as std.Logger;
  const msgBuilder = new builder.Console.MsgBuilder('INFO', log.setPackage('testpkg').setThreshold('info'));
  assertEquals(msgBuilder.emit('test'), {
    level: 'INFO',
    msg: 'test',
    timestamp: new Date(),
    package: 'testpkg',
  });
});
