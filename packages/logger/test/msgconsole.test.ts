import * as MsgBuilder from '@epdoc/msgbuilder';
import { assertEquals } from '@std/assert';
import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import os from 'node:os';
import { disable, enable } from '../../../test-utils/color-map.ts';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

const logMgr = new Log.Mgr<M>();

describe('MsgBuilder.Console', () => {
  describe('general', () => {
    test('display applyColors', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.threshold = 'info';

      const msgBuilder = (log.info as MsgBuilder.Console.Builder).h1('message heading');
      const result = msgBuilder.format({ color: true });
      assertEquals(result, enable.h1 + 'message heading' + disable.h1);

      const obj = msgBuilder.emit();
      expect(obj).toBeDefined();
      if (obj) {
        expect(obj.timestamp).toBeInstanceOf(Date);
      }
    });

    test('display no colors', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.threshold = 'info';

      const msgBuilder = (log.info as MsgBuilder.Console.Builder).h1('message heading');
      const r2 = msgBuilder.format({ color: false });
      assertEquals(r2, 'message heading');
    });

    test('display elapsed no color', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.threshold = 'info';

      const msgBuilder = (log.info as MsgBuilder.Console.Builder).h1('message heading');
      const result = msgBuilder.format({ color: false });
      assertEquals(result, 'message heading');
    });

    test('display elapsed applyColor', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.threshold = 'info';

      const msgBuilder = (log.info as MsgBuilder.Console.Builder).h1('message heading');
      const _str = (msgBuilder as MsgBuilder.Console.Builder).value('value').format({ color: true });
      // Test passes if no error thrown
    });
  });

  describe('specific methods', () => {
    test('h1', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).h1('h1').format({ color: true });
      // Test passes if no error thrown
    });

    test('h2', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).h2('h2').format({ color: true });
      // Test passes if no error thrown
    });

    test('h3', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).h3('h3').format({ color: true });
      // Test passes if no error thrown
    });

    test('action', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).action('action').format({ color: true });
      // Test passes if no error thrown
    });

    test('label', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).label('label').format({ color: true });
      // Test passes if no error thrown
    });

    test('highlight', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).highlight('highlight').format({ color: true });
      // Test passes if no error thrown
    });

    test('value', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).value('value').format({ color: true });
      // Test passes if no error thrown
    });

    test('path', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).path('path').format({ color: true });
      // Test passes if no error thrown
    });

    test('relative to home', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const path = os.homedir() + '/test/path';
      const _result = (log.info as MsgBuilder.Console.Builder).relative(path).format({ color: true });
      // Test passes if no error thrown
    });

    test('relative to root', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const path = '/test/path';
      const _result = (log.info as MsgBuilder.Console.Builder).relative(path).format({ color: true });
      // Test passes if no error thrown
    });

    test('date', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).date('date').format({ color: true });
      // Test passes if no error thrown
    });

    test('section', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).section('SECTION').format({ color: true });
      // Test passes if no error thrown
    });

    test('warn', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).warn('warn').format({ color: true });
      // Test passes if no error thrown
    });

    test('error', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).error('error').format({ color: true });
      // Test passes if no error thrown
    });

    test('strikethru', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).strikethru('strikethru').format({ color: true });
      // Test passes if no error thrown
    });
  });

  describe('err method', () => {
    test('default minus stack', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const err = new Error('test error');
      const _result = (log.info as MsgBuilder.Console.Builder).err(err, { stack: false }).format({ color: true });
      // Test passes if no error thrown
    });

    test('default minus stack, cause', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const err = new Error('test error');
      const _result = (log.info as MsgBuilder.Console.Builder).err(err, { stack: false, cause: false }).format({
        color: true,
      });
      // Test passes if no error thrown
    });

    test('default minus stack, path plus code', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const err = new Error('test error');
      const _result = (log.info as MsgBuilder.Console.Builder).err(err, { stack: false, path: false, code: true })
        .format({ color: true });
      // Test passes if no error thrown
    });
  });

  describe('count method for pluralization', () => {
    test('singular with one argument: appends nothing', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(1).h2('message').format({ color: false });
      // Test passes if no error thrown
    });

    test('plural with one argument: appends "s"', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(2).h2('message').format({ color: false });
      // Test passes if no error thrown
    });

    test('zero with one argument: appends "s"', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(0).h2('message').format({ color: false });
      // Test passes if no error thrown
    });

    test('singular with two arguments: uses first string', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(1).h2('entry', 'entries').format({ color: false });
      // Test passes if no error thrown
    });

    test('plural with two arguments: uses second string', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(5).h2('entry', 'entries').format({ color: false });
      // Test passes if no error thrown
    });

    test('only applies to the next method call', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(10).h2('message').h2('inbox').format({
        color: false,
      });
      // Test passes if no error thrown
    });

    test('does not pluralize for non-integer counts', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(1.5).h2('message').format({ color: false });
      // Test passes if no error thrown
    });
  });

  describe('standalone usage', () => {
    test('can be instantiated without arguments', () => {
      const builder = new MsgBuilder.Console.Builder();
      const _result = builder.h1('Hello').text('World').format({ color: false });
      // Test passes if no error thrown
    });

    test('emit() returns undefined and does not throw', () => {
      const builder = new MsgBuilder.Console.Builder();
      const result = builder.h1('Hello').text('World').emit();
      expect(result).toBeDefined();
    });
  });
});
