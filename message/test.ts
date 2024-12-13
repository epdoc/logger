import * as cli from '@epdoc/cli';
import { assertEquals } from '@std/assert';
import { MsgBuilder } from './builder.ts';

Deno.test('test', () => {
  const builder = new MsgBuilder('INFO', new cli.Logger().setPackage('testpkg').setThreshold('info'));
  assertEquals(builder.emit('test'), {
    level: 'INFO',
    msg: 'test',
    timestamp: new Date(),
    package: 'testpkg',
  });
});
