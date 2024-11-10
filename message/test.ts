import { assertEquals } from '@std/assert';
import { type ILogEmitter, MsgBuilder } from './builder.ts';

class Emitter implements ILogEmitter {
  emit() {}
  showLevel(): this {
    return this;
  }
}

Deno.test('test', () => {
  const builder = new MsgBuilder('INFO', new Emitter());
  assertEquals(builder.emit('test'), { level: 'INFO', msg: 'test' });
});
