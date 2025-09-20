import { assertEquals } from '@std/assert';
import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import os from 'node:os';
import * as MsgBuilder from '../src/mod.ts';
import { disable, enable } from './color-map.ts';

const home = os.userInfo().homedir;

describe('MsgBuilder.Console', () => {
  describe('general', () => {
    test('display applyColors', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const builder = msgBuilder
        .h1('h1')
        .h2('h2')
        .h3('h3')
        .action('action')
        .label('label')
        .highlight('highlight')
        .value('value')
        .path('path')
        .date('date')
        .strikethru('strikethru')
        .warn('warn')
        .error('error');
      const result = builder.format({ color: true });
      console.log(result);
      expect(result).toMatch(
        /^.*h1.*h2.*h3.*action.*label.*highlight.*value.*path.*date.*strikethru.*warn.*error.*$/,
      );
      const r2 = builder.format({ color: false });
      console.log(r2);
      expect(r2).toEqual('h1 h2 h3 action label highlight value path date strikethru warn error');
    });
    test('display no colors', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .h1('h1')
        .h2('h2')
        .h3('h3')
        .action('action')
        .label('label')
        .highlight('highlight')
        .value('value')
        .path('path')
        .date('date')
        .strikethru('strikethru')
        .warn('warn')
        .error('error')
        .format({ color: false });
      console.log(result);
      assertEquals(result, 'h1 h2 h3 action label highlight value path date strikethru warn error');
    });
    test('display applyColor', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const str = msgBuilder.value('value').format();
      console.log(str);
      assertEquals(true, /value/.test(str));
    });
  });
  describe('specific methods', () => {
    test('h1', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.h1('h1').format({ color: true });
      assertEquals(result, enable.h1 + 'h1' + disable.h1);
    });
    test('h2', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.h2('h2').format({ color: true });
      assertEquals(result, enable.h2 + 'h2' + disable.h2);
    });
    test('h3', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.h3('h3').format({ color: true });
      assertEquals(result, enable.h3 + 'h3' + disable.h3);
    });
    test('action', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.action('action').format({ color: true });
      assertEquals(result, enable.action + 'action' + disable.action);
    });
    test('label', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.label('label').format({ color: true });
      assertEquals(result, '\x1b[34mlabel\x1b[39m');
    });
    test('highlight', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.highlight('highlight').format({ color: true });
      assertEquals(result, enable.highlight + 'highlight' + disable.highlight);
    });
    test('value', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.value('value').format({ color: true });
      assertEquals(result, enable.value + 'value' + disable.value);
    });
    test('path', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.path('path').format({ color: true });
      console.log(result);
      assertEquals(result, enable.path + 'path' + disable.path);
    });
    test('relative to home', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const path = `${home}/relative/to/home`;
      const result = msgBuilder.relative(path).format({ color: true });
      assertEquals(result, enable.path + '~/relative/to/home' + disable.path);
    });
    test('relative to root', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const path = '/relative/to/root';
      const result = msgBuilder.relative(path).format({ color: true });
      assertEquals(result, enable.path + '~/../../relative/to/root' + disable.path);
    });
    test('date', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.date('date').format({ color: true });
      assertEquals(result, enable.date + 'date' + disable.date);
    });
    test('section', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.section('SECTION').format({ color: true });
      assertEquals(
        result,
        enable.h1 +
          '----------------------------------- SECTION ------------------------------------' +
          disable.h1,
      );
    });
    test('warn', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.warn('warn').format({ color: true });
      assertEquals(result, enable.warn + 'warn' + disable.warn);
    });
    test('error', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.error('error').format({ color: true });
      assertEquals(result, enable.error + 'error' + disable.error);
    });
    test('strikethru', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.strikethru('strikethru').format({ color: true });
      assertEquals(result, enable.strikethru + 'strikethru' + disable.strikethru);
    });
  });
  describe('err method', () => {
    const err = new Error('message');
    const errOpts = { code: 32, path: `${home}/relative/to/home`, cause: 'unit tests' };
    Object.assign(err, errOpts);
    test('default minus stack', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.err(err, { stack: false }).format({ color: true });
      assertEquals(
        result,
        enable.error +
          'message' +
          disable.error +
          ' ' +
          enable.label +
          'cause:' +
          disable.label +
          ' ' +
          enable.value +
          errOpts.cause +
          disable.value +
          ' ' +
          enable.path +
          '~/relative/to/home' +
          disable.path,
      );
    });
    test('default minus stack, cause', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.err(err, { stack: false, cause: false }).format({ color: true });
      assertEquals(
        result,
        enable.error + 'message' + disable.error + ' ' + enable.path + '~/relative/to/home' + disable.path,
      );
    });
    test('default minus stack, path plus code', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.err(err, { stack: false, path: false, code: true }).format({ color: true });
      assertEquals(
        result,
        enable.error +
          'message' +
          disable.error +
          ' ' +
          enable.label +
          'code:' +
          disable.label +
          ' ' +
          enable.value +
          errOpts.code +
          disable.value +
          ' ' +
          enable.label +
          'cause:' +
          disable.label +
          ' ' +
          enable.value +
          errOpts.cause +
          disable.value,
      );
    });
  });
  describe('count method for pluralization', () => {
    test('singular with one argument: appends nothing', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(1).h2('message').format({ color: false });
      assertEquals(result, '1 message');
    });

    test('plural with one argument: appends "s"', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(2).h2('message').format({ color: false });
      assertEquals(result, '2 messages');
    });

    test('zero with one argument: appends "s"', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(0).h2('message').format({ color: false });
      assertEquals(result, '0 messages');
    });

    test('singular with two arguments: uses first string', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(1).h2('entry', 'entries').format({ color: false });
      assertEquals(result, '1 entry');
    });

    test('plural with two arguments: uses second string', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(5).h2('entry', 'entries').format({ color: false });
      assertEquals(result, '5 entries');
    });

    test('only applies to the next method call', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(10).h2('message').h2('inbox').format({ color: false });
      assertEquals(result, '10 messages inbox');
    });

    test('does not pluralize for non-integer counts', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(1.5).h2('message').format({ color: false });
      assertEquals(result, '1.5 message');
    });
  });

  describe('standalone usage', () => {
    test('can be instantiated without arguments', () => {
      const builder = new MsgBuilder.Console.Builder();
      const result = builder.h1('Hello').text('World').format({ color: false });
      assertEquals(result, 'Hello World');
    });

    test('emit() outputs with color', () => {
      const tester = new MsgBuilder.TestEmitter();
      const builder = new MsgBuilder.Console.Builder(tester);
      const result = builder.h2('test').emit();
      expect(result).toBeDefined();
      if (result) {
        expect(result.data).toBeUndefined();
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(result.formatter).toBeInstanceOf(MsgBuilder.Console.Builder);
        expect(tester.output).toEqual(enable.h2 + 'test' + disable.h2);
      }
    });
    test('emit() outputs with nocolor', () => {
      const tester = new MsgBuilder.TestEmitter();
      tester.color = false;
      const builder = new MsgBuilder.Console.Builder(tester);
      const result = builder.text('test').emit();
      expect(result).toBeDefined();
      if (result) {
        expect(result.data).toBeUndefined();
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(result.formatter).toBeInstanceOf(MsgBuilder.Console.Builder);
        expect(tester.output).toEqual('test');
      }
    });
  });
});
