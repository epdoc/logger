import * as MsgBuilder from '@epdoc/msgbuilder';
import * as assert from 'node:assert';

Deno.test('MsgBuilder.Console conditional', async (t) => {
  await t.step('if', async (t) => {
    await t.step('if(true)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(true).h1('h1').format({ color: false });
      assert.strictEqual(result, 'h1');
    });
    await t.step('if(false)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).h1('h1').format({ color: false });
      assert.strictEqual(result, '');
    });
  });

  await t.step('if/else', async (t) => {
    await t.step('if(true)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(true).h1('h1').else().h2('h2').format({ color: false });
      assert.strictEqual(result, 'h1');
    });
    await t.step('if(false)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).h1('h1').else().h2('h2').format({ color: false });
      assert.strictEqual(result, 'h2');
    });
  });

  await t.step('if/elif/else', async (t) => {
    await t.step('if(true)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(true).h1('h1').elif(true).h2('h2').else().h3('h3').format({ color: false });
      assert.strictEqual(result, 'h1');
    });
    await t.step('if(false) elif(true)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).h1('h1').elif(true).h2('h2').else().h3('h3').format({ color: false });
      assert.strictEqual(result, 'h2');
    });
    await t.step('if(false) elif(false)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).h1('h1').elif(false).h2('h2').else().h3('h3').format({ color: false });
      assert.strictEqual(result, 'h3');
    });
  });

  await t.step('if/endif', async (t) => {
    await t.step('if(true)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(true).h1('h1').endif().h2('h2').format({ color: false });
      assert.strictEqual(result, 'h1 h2');
    });
    await t.step('if(false)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).h1('h1').endif().h2('h2').format({ color: false });
      assert.strictEqual(result, 'h2');
    });
  });

  await t.step('nested if/endif', async (t) => {
    await t.step('if(true).if(true) - both true', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(true).text('a').if(true).text('b').endif().text('c').endif().text('d').format({
        color: false,
      });
      assert.strictEqual(result, 'a b c d');
    });
    await t.step('if(true).if(false) - outer true, inner false', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(true).text('a').if(false).text('b').endif().text('c').endif().text('d').format({
        color: false,
      });
      assert.strictEqual(result, 'a c d');
    });
    await t.step('if(false).if(true) - outer false, inner true', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).text('a').if(true).text('b').endif().text('c').endif().text('d').format({
        color: false,
      });
      assert.strictEqual(result, 'd');
    });
    await t.step('if(false).if(false) - both false', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).text('a').if(false).text('b').endif().text('c').endif().text('d').format({
        color: false,
      });
      assert.strictEqual(result, 'd');
    });
    await t.step('triple nesting - all true', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .if(true).text('1')
        .if(true).text('2')
        .if(true).text('3')
        .endif()
        .endif()
        .endif()
        .format({ color: false });
      assert.strictEqual(result, '1 2 3');
    });
    await t.step('triple nesting - middle false', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .if(true).text('1')
        .if(false).text('2')
        .if(true).text('3')
        .endif()
        .endif()
        .endif()
        .format({ color: false });
      assert.strictEqual(result, '1');
    });
    await t.step('triple nesting - innermost false', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .if(true).text('1')
        .if(true).text('2')
        .if(false).text('3')
        .endif().text('4')
        .endif().text('5')
        .endif()
        .format({ color: false });
      assert.strictEqual(result, '1 2 4 5');
    });
    await t.step('asymmetric nesting', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .if(true).text('a')
        .if(true).text('b')
        .endif().text('c')
        .if(true).text('d')
        .endif().text('e')
        .endif()
        .format({ color: false });
      assert.strictEqual(result, 'a b c d e');
    });
  });

  await t.step('nested if/else/endif', async (t) => {
    await t.step('nested else - outer true, inner else', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .if(true).text('outer')
        .if(false).text('if-branch')
        .else().text('else-branch')
        .endif()
        .endif()
        .format({ color: false });
      assert.strictEqual(result, 'outer else-branch');
    });
    await t.step('nested else - outer false, inner true', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .if(false).text('outer')
        .if(true).text('inner-if')
        .else().text('inner-else')
        .endif()
        .endif()
        .format({ color: false });
      assert.strictEqual(result, '');
    });
    await t.step('deeply nested if/else', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .if(true).text('A')
        .if(true).text('B')
        .if(false).text('C-if')
        .else().text('C-else')
        .endif()
        .endif()
        .endif()
        .format({ color: false });
      assert.strictEqual(result, 'A B C-else');
    });
  });
});
