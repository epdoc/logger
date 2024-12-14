import { assertEquals } from '@std/assert';
import { CliLogger, LogMgr, MsgBuilder } from '../mod.ts';

const logMgr = new LogMgr('cli');

Deno.test('test', () => {
  const log: CliLogger = logMgr.getLogger() as CliLogger;
  const builder = new MsgBuilder('INFO', log.setPackage('testpkg').setThreshold('info'));
  assertEquals(builder.emit('test'), {
    level: 'INFO',
    msg: 'test',
    timestamp: new Date(),
    package: 'testpkg',
  });
});
