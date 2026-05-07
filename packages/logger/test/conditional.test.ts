import * as MsgBuilder from '@epdoc/msgbuilder';
import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';

describe('MsgBuilder.Console conditional', () => {
  describe('if', () => {
    test('if(true)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(true).h1('h1').format({ color: false });
      expect(result).toBe('h1');
    });
    test('if(false)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).h1('h1').format({ color: false });
      expect(result).toBe('');
    });
  });

  describe('if/else', () => {
    test('if(true)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(true).h1('h1').else().h2('h2').format({ color: false });
      expect(result).toBe('h1');
    });
    test('if(false)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).h1('h1').else().h2('h2').format({ color: false });
      expect(result).toBe('h2');
    });
  });

  describe('if/elif/else', () => {
    test('if(true)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(true).h1('h1').elif(true).h2('h2').else().h3('h3').format({ color: false });
      expect(result).toBe('h1');
    });
    test('if(false) elif(true)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).h1('h1').elif(true).h2('h2').else().h3('h3').format({ color: false });
      expect(result).toBe('h2');
    });
    test('if(false) elif(false)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).h1('h1').elif(false).h2('h2').else().h3('h3').format({ color: false });
      expect(result).toBe('h3');
    });
  });

  describe('if/endif', () => {
    test('if(true)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(true).h1('h1').endif().h2('h2').format({ color: false });
      expect(result).toBe('h1 h2');
    });
    test('if(false)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).h1('h1').endif().h2('h2').format({ color: false });
      expect(result).toBe('h2');
    });
  });

  describe('nested if/endif', () => {
    test('if(true).if(true) - both true', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(true).text('a').if(true).text('b').endif().text('c').endif().text('d').format({
        color: false,
      });
      expect(result).toBe('a b c d');
    });
    test('if(true).if(false) - outer true, inner false', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(true).text('a').if(false).text('b').endif().text('c').endif().text('d').format({
        color: false,
      });
      expect(result).toBe('a c d');
    });
    test('if(false).if(true) - outer false, inner true', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).text('a').if(true).text('b').endif().text('c').endif().text('d').format({
        color: false,
      });
      expect(result).toBe('d');
    });
    test('if(false).if(false) - both false', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.if(false).text('a').if(false).text('b').endif().text('c').endif().text('d').format({
        color: false,
      });
      expect(result).toBe('d');
    });
    test('triple nesting - all true', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .if(true).text('1')
        .if(true).text('2')
        .if(true).text('3')
        .endif()
        .endif()
        .endif()
        .format({ color: false });
      expect(result).toBe('1 2 3');
    });
    test('triple nesting - middle false', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .if(true).text('1')
        .if(false).text('2')
        .if(true).text('3')
        .endif()
        .endif()
        .endif()
        .format({ color: false });
      expect(result).toBe('1');
    });
    test('triple nesting - innermost false', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .if(true).text('1')
        .if(true).text('2')
        .if(false).text('3')
        .endif().text('4')
        .endif().text('5')
        .endif()
        .format({ color: false });
      expect(result).toBe('1 2 4 5');
    });
    test('asymmetric nesting', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .if(true).text('a')
        .if(true).text('b')
        .endif().text('c')
        .if(true).text('d')
        .endif().text('e')
        .endif()
        .format({ color: false });
      expect(result).toBe('a b c d e');
    });
  });

  describe('nested if/else/endif', () => {
    test('nested else - outer true, inner else', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .if(true).text('outer')
        .if(false).text('if-branch')
        .else().text('else-branch')
        .endif()
        .endif()
        .format({ color: false });
      expect(result).toBe('outer else-branch');
    });
    test('nested else - outer false, inner true', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .if(false).text('outer')
        .if(true).text('inner-if')
        .else().text('inner-else')
        .endif()
        .endif()
        .format({ color: false });
      expect(result).toBe('');
    });
    test('deeply nested if/else', () => {
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
      expect(result).toBe('A B C-else');
    });
  });
});
