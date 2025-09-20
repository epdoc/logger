import { assertEquals } from '@std/assert';
import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import os from 'node:os';
import * as Log from '../mod.ts';
import { disable, enable } from './color-map.ts';

type M = Log.MsgBuilder.Console.Builder;
const home = os.userInfo().homedir;

const logMgr = new Log.Mgr();
const log: Log.Std.Logger<M> = logMgr.getLogger() as Log.Std.Logger<M>;

describe('MsgBuilder.Console', () => {
  describe('general', () => {
    test('display applyColors', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
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
      const result = builder.format(true, 'text');
      console.log(result);
      expect(result).toMatch(
        /^.*h1.*h2.*h3.*action.*label.*highlight.*value.*path.*date.*strikethru.*warn.*error.*$/,
      );
      const r2 = builder.format(false);
      console.log(r2);
      expect(r2).toEqual('h1 h2 h3 action label highlight value path date strikethru warn error');
      const obj = builder.emit();
      expect(obj).toBeDefined();
      expect(obj!.level).toBe('INFO');
    });
    test('display no colors', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
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
        .format(false, 'text');
      console.log(result);
      assertEquals(result, 'h1 h2 h3 action label highlight value path date strikethru warn error');
    });
    test('display elapsed no color', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.h1('h1').ewt(8);
      expect(result).toBeDefined();
      assertEquals(result!.level, 'INFO');

      // assertEquals(true, /^h1 \([\d\.]+ ms response\)$/.test(str));
    });
    test('display elapsed applyColor', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const str = msgBuilder.value('value').format(true, 'text');
      console.log(str);
      assertEquals(true, /value/.test(str));
    });
  });
  describe('specific methods', () => {
    test('h1', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.h1('h1').format(true);
      assertEquals(result, enable.h1 + 'h1' + disable.h1);
    });
    test('h2', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.h2('h2').format(true);
      assertEquals(result, enable.h2 + 'h2' + disable.h2);
    });
    test('h3', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.h3('h3').format(true);
      assertEquals(result, enable.h3 + 'h3' + disable.h3);
    });
    test('action', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.action('action').format(true);
      assertEquals(result, enable.action + 'action' + disable.action);
    });
    test('label', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.label('label').format(true);
      assertEquals(result, '\x1b[34mlabel\x1b[39m');
    });
    test('highlight', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.highlight('highlight').format(true);
      assertEquals(result, enable.highlight + 'highlight' + disable.highlight);
    });
    test('value', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.value('value').format(true);
      assertEquals(result, enable.value + 'value' + disable.value);
    });
    test('path', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.path('path').format(true);
      console.log(result);
      assertEquals(result, enable.path + 'path' + disable.path);
    });
    test('relative to home', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const path = `${home}/relative/to/home`;
      const result = msgBuilder.relative(path).format(true);
      assertEquals(result, enable.path + '~/relative/to/home' + disable.path);
    });
    test('relative to root', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const path = '/relative/to/root';
      const result = msgBuilder.relative(path).format(true);
      assertEquals(result, enable.path + '~/../../relative/to/root' + disable.path);
    });
    test('date', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.date('date').format(true);
      assertEquals(result, enable.date + 'date' + disable.date);
    });
    test('section', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.section('SECTION').format(true);
      assertEquals(
        result,
        enable.h1 +
          '----------------------------------- SECTION ------------------------------------' +
          disable.h1,
      );
    });
    test('warn', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.warn('warn').format(true);
      assertEquals(result, enable.warn + 'warn' + disable.warn);
    });
    test('error', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.error('error').format(true);
      assertEquals(result, enable.error + 'error' + disable.error);
    });
    test('strikethru', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.strikethru('strikethru').format(true);
      assertEquals(result, enable.strikethru + 'strikethru' + disable.strikethru);
    });
  });
  describe('err method', () => {
    const err = new Error('message');
    const errOpts = { code: 32, path: `${home}/relative/to/home`, cause: 'unit tests' };
    Object.assign(err, errOpts);
    test('default minus stack', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.err(err, { stack: false }).format(true);
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
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.err(err, { stack: false, cause: false }).format(true);
      assertEquals(
        result,
        enable.error + 'message' + disable.error + ' ' + enable.path + '~/relative/to/home' + disable.path,
      );
    });
    test('default minus stack, path plus code', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.err(err, { stack: false, path: false, code: true }).format(true);
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
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.count(1).h2('message').format(false);
      assertEquals(result, '1 message');
    });

    test('plural with one argument: appends "s"', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.count(2).h2('message').format(false);
      assertEquals(result, '2 messages');
    });

    test('zero with one argument: appends "s"', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.count(0).h2('message').format(false);
      assertEquals(result, '0 messages');
    });

    test('singular with two arguments: uses first string', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.count(1).h2('entry', 'entries').format(false);
      assertEquals(result, '1 entry');
    });

    test('plural with two arguments: uses second string', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.count(5).h2('entry', 'entries').format(false);
      assertEquals(result, '5 entries');
    });

    test('only applies to the next method call', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.count(10).h2('message').h2('inbox').format(false);
      assertEquals(result, '10 messages inbox');
    });

    test('does not pluralize for non-integer counts', () => {
      const msgBuilder = new Log.MsgBuilder.Console.Builder('INFO', log);
      const result = msgBuilder.count(1.5).h2('message').format(false);
      assertEquals(result, '1.5 message');
    });
  });

  describe('standalone usage', () => {
    test('can be instantiated without arguments', () => {
      const builder = new Log.MsgBuilder.Console.Builder();
      const result = builder.h1('Hello').text('World').format(false);
      assertEquals(result, 'Hello World');
    });

    test('emit() returns undefined and does not throw', () => {
      const builder = new Log.MsgBuilder.Console.Builder();
      const result = builder.text('test').emit();
      expect(result).toBeUndefined();
    });
  });
});
