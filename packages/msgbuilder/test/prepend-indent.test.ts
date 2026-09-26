import { assertEquals } from '@std/assert';
import { Console } from '../src/mod.ts';

Deno.test('MsgBuilder.prependIndent', async (t) => {
  await t.step('prepends styled indentation levels in order', () => {
    const builder = new Console.Builder();
    builder
      .prependIndent([
        { str: '▌', style: (s) => `<${s}>` },
        { str: '│' },
      ])
      .plain('hello');

    assertEquals(builder.format({ color: false }), '▌ │ hello');
    assertEquals(builder.format({ color: true }), '<▌> │ hello');
  });

  await t.step('no levels is a no-op', () => {
    const builder = new Console.Builder();
    builder.prependIndent([]).plain('hello');
    assertEquals(builder.format({ color: false }), 'hello');
  });
});
