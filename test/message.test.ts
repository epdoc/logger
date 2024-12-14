import { assertEquals } from '@std/assert';
import { LogMgr, MsgBuilder, std } from '../mod.ts';

const logMgr = new LogMgr('std');

Deno.test('test', () => {
  const log: std.Logger = logMgr.getLogger() as std.Logger;
  const builder = new MsgBuilder('INFO', log.setPackage('testpkg').setThreshold('info'));
  assertEquals(builder.emit('test'), {
    level: 'INFO',
    msg: 'test',
    timestamp: new Date(),
    package: 'testpkg',
  });
});
