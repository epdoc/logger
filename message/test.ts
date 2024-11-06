import { assertEquals } from '@std/assert';
import { type ILogEmitter, MsgBuilder } from './builder.ts';

const emitter: ILogEmitter = {
  emit: () => {},
};

Deno.test('test', () => {
  const builder = new MsgBuilder('INFO', emitter);
  assertEquals(builder.emit('test'), 'test');
});
