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
});
