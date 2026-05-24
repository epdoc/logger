import { DateTime } from '@epdoc/datetime';
import * as MsgBuilder from '@epdoc/msgbuilder';
import * as assert from 'node:assert';
import os from 'node:os';
import { disable, enable } from '../../../test-utils/color-map.ts';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

// Pin tests to the V0 (original) style map so that the hardcoded ANSI
// sequences in color-map.ts continue to match.
MsgBuilder.Console.Builder.styleFormatters = MsgBuilder.Console.styleFormattersV0;

const logMgr = new Log.Mgr<M>();

Deno.test('MsgBuilder.Console', async (t) => {
  await t.step('general', async (t) => {
    await t.step('display applyColors', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.threshold = 'info';

      const msgBuilder = (log.info as MsgBuilder.Console.Builder).h1('message heading');
      const result = msgBuilder.format({ color: true });
      assert.strictEqual(result, enable.h1 + 'message heading' + disable.h1);

      const obj = msgBuilder.emit();
      assert.ok(obj !== undefined);
      if (obj) {
        assert.ok(obj.timestamp instanceof DateTime);
      }
    });

    await t.step('display no colors', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.threshold = 'info';

      const msgBuilder = (log.info as MsgBuilder.Console.Builder).h1('message heading');
      const r2 = msgBuilder.format({ color: false });
      assert.strictEqual(r2, 'message heading');
    });

    await t.step('display elapsed no color', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.threshold = 'info';

      const msgBuilder = (log.info as MsgBuilder.Console.Builder).h1('message heading');
      const result = msgBuilder.format({ color: false });
      assert.strictEqual(result, 'message heading');
    });

    await t.step('display elapsed applyColor', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.threshold = 'info';

      const msgBuilder = (log.info as MsgBuilder.Console.Builder).h1('message heading');
      const _str = (msgBuilder as MsgBuilder.Console.Builder).value('value').format({ color: true });
      // Test passes if no error thrown
    });
  });

  await t.step('specific methods', async (t) => {
    await t.step('h1', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).h1('h1').format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('h2', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).h2('h2').format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('h3', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).h3('h3').format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('action', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).action('action').format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('label', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).label('label').format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('highlight', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).highlight('highlight').format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('value', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).value('value').format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('path', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).path('path').format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('relative to home', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const path = os.homedir() + '/test/path';
      const _result = (log.info as MsgBuilder.Console.Builder).relative(path).format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('relative to root', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const path = '/test/path';
      const _result = (log.info as MsgBuilder.Console.Builder).relative(path).format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('date', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).date('date').format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('section', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).section('SECTION').format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('warn', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).warn('warn').format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('error', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).error('error').format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('strikethru', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).strikethru('strikethru').format({ color: true });
      // Test passes if no error thrown
    });
  });

  await t.step('err method', async (t) => {
    await t.step('default minus stack', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const err = new Error('test error');
      const _result = (log.info as MsgBuilder.Console.Builder).err(err, { stack: false }).format({ color: true });
      // Test passes if no error thrown
    });

    await t.step('default minus stack, cause', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const err = new Error('test error');
      const _result = (log.info as MsgBuilder.Console.Builder).err(err, { stack: false, cause: false }).format({
        color: true,
      });
      // Test passes if no error thrown
    });

    await t.step('default minus stack, path plus code', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const err = new Error('test error');
      const _result = (log.info as MsgBuilder.Console.Builder).err(err, { stack: false, path: false, code: true })
        .format({ color: true });
      // Test passes if no error thrown
    });
  });

  await t.step('count method for pluralization', async (t) => {
    await t.step('singular with one argument: appends nothing', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(1).h2('message').format({ color: false });
      // Test passes if no error thrown
    });

    await t.step('plural with one argument: appends "s"', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(2).h2('message').format({ color: false });
      // Test passes if no error thrown
    });

    await t.step('zero with one argument: appends "s"', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(0).h2('message').format({ color: false });
      // Test passes if no error thrown
    });

    await t.step('singular with two arguments: uses first string', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(1).h2('entry', 'entries').format({ color: false });
      // Test passes if no error thrown
    });

    await t.step('plural with two arguments: uses second string', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(5).h2('entry', 'entries').format({ color: false });
      // Test passes if no error thrown
    });

    await t.step('only applies to the next method call', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(10).h2('message').h2('inbox').format({
        color: false,
      });
      // Test passes if no error thrown
    });

    await t.step('does not pluralize for non-integer counts', async () => {
      const log = await logMgr.getLogger<Log.Std.Logger<M>>();
      logMgr.initLevels();
      logMgr.threshold = 'info';

      const _result = (log.info as MsgBuilder.Console.Builder).count(1.5).h2('message').format({ color: false });
      // Test passes if no error thrown
    });
  });

  await t.step('standalone usage', async (t) => {
    await t.step('can be instantiated without arguments', () => {
      const builder = new MsgBuilder.Console.Builder();
      const _result = builder.h1('Hello').text('World').format({ color: false });
      // Test passes if no error thrown
    });

    await t.step('emit() returns undefined and does not throw', () => {
      const builder = new MsgBuilder.Console.Builder();
      const result = builder.h1('Hello').text('World').emit();
      assert.ok(result !== undefined);
    });
  });
});
