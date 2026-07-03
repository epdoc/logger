import { DateTime } from '@epdoc/datetime';
import { assert, assertEquals, assertFalse } from '@std/assert';
import os from 'node:os';
import { disable, enable } from '../../../test-utils/color-map.ts';
import * as MsgBuilder from '../src/mod.ts';

const home = os.userInfo().homedir;

// Pin tests to the V0 (original) style map so that the hardcoded ANSI
// sequences in color-map.ts continue to match.
MsgBuilder.Console.Builder.styleFormatters = MsgBuilder.Console.styleFormattersV0;

Deno.test('MsgBuilder.Console', async (t) => {
  await t.step('general', async (t2) => {
    await t2.step('display applyColors', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const builder = msgBuilder
        .h1('h1')
        .h2('h2')
        .h3('h3')
        .action('action')
        .label('label')
        .highlight('highlight')
        .value('value')
        .url('url')
        .path('path')
        .code('code')
        .date('date')
        .success('success')
        .strikethru('strikethru')
        .warn('warn')
        .error('error');
      const result = builder.format({ color: true });
      console.log(result);
      assert(
        /^.*h1.*h2.*h3.*action.*label.*highlight.*value.*url.*path.*code.*date.*success.*strikethru.*warn.*error.*$/
          .test(
            result,
          ),
      );
      const r2 = builder.format({ color: false });
      console.log(r2);
      assertEquals(
        r2,
        'h1 h2 h3 action label highlight value url path code date success strikethru warn error',
      );
    });

    await t2.step('display no colors', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder
        .h1('h1')
        .h2('h2')
        .h3('h3')
        .action('action')
        .label('label')
        .highlight('highlight')
        .value('value')
        .url('url')
        .path('path')
        .code('code')
        .date('date')
        .success('success')
        .strikethru('strikethru')
        .warn('warn')
        .error('error')
        .format({ color: false });
      console.log(result);
      assertEquals(
        result,
        'h1 h2 h3 action label highlight value url path code date success strikethru warn error',
      );
    });

    await t2.step('display applyColor', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const str = msgBuilder.value('value').format();
      console.log(str);
      assert(/value/.test(str));
    });
  });

  await t.step('specific methods', async (t2) => {
    await t2.step('h1', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.h1('h1').format({ color: true });
      assertEquals(result, enable.h1 + 'h1' + disable.h1);
    });

    await t2.step('h2', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.h2('h2').format({ color: true });
      assertEquals(result, enable.h2 + 'h2' + disable.h2);
    });

    await t2.step('h3', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.h3('h3').format({ color: true });
      assertEquals(result, enable.h3 + 'h3' + disable.h3);
    });

    await t2.step('action', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.action('action').format({ color: true });
      assertEquals(result, enable.action + 'action' + disable.action);
    });

    await t2.step('label', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.label('label').format({ color: true });
      assertEquals(result, enable.label + 'label' + disable.label);
    });

    await t2.step('highlight', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.highlight('highlight').format({ color: true });
      assertEquals(result, enable.highlight + 'highlight' + disable.highlight);
    });

    await t2.step('value', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.value('value').format({ color: true });
      assertEquals(result, enable.value + 'value' + disable.value);
    });

    await t2.step('path', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.path('path').format({ color: true });
      console.log(result);
      assertEquals(result, enable.path + 'path' + disable.path);
    });

    await t2.step('relative to home', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const path = `${home}/relative/to/home`;
      const result = msgBuilder.relative(path, 'home').format({ color: true, reset: true });
      assertEquals(result, enable.path + '~/relative/to/home' + disable.path);
      const result2 = msgBuilder.relative(path).format({ color: true });
      assertEquals(result2, enable.path + '~/relative/to/home' + disable.path);
    });

    await t2.step('date with string (fallback)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.date('date').format({ color: true });
      assertEquals(result, enable.date + 'date' + disable.date);
    });

    await t2.step('date with DateTime object (default format)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const testDate = DateTime.from('2024-03-15T10:30:45.000Z');
      const result = msgBuilder.date(testDate).format({ color: false });
      // Result will be in local timezone, so we just check it's formatted
      assert(result.length > 0);
      assert(result.includes('2024'));
    });

    await t2.step('date with DateTime object (custom format)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const testDate = DateTime.from('2024-03-15T10:30:45.000Z');
      const result = msgBuilder.date(testDate, 'yyyy-MM-dd').format({ color: false });
      assert(result.includes('2024-03-15'));
    });

    await t2.step('date with DateTime object (options with tz)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const testDate = DateTime.from('2024-03-15T10:30:45.000Z');
      const result = msgBuilder.date(testDate, { format: 'HH:mm', tz: 'utc' }).format({ color: false });
      assertEquals(result, '10:30');
    });

    await t2.step('date with Temporal.Instant', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const instant = DateTime.from(Temporal.Instant.from('2024-03-15T10:30:45.000Z'));
      const result = msgBuilder.date(instant, { format: 'yyyy-MM-dd', tz: 'utc' }).format({ color: false });
      assertEquals(result, '2024-03-15');
    });

    await t2.step('date with Temporal.ZonedDateTime', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const zdt = DateTime.from(Temporal.ZonedDateTime.from('2024-03-15T10:30:45.000Z[UTC]'));
      const result = msgBuilder.date(zdt, { format: 'HH:mm:ss', tz: 'utc' }).format({ color: false });
      assertEquals(result, '10:30:45');
    });

    await t2.step('section', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.section('SECTION').format({ color: true });
      assertEquals(
        result,
        enable.h1 +
          '----------------------------------- SECTION ------------------------------------' +
          disable.h1,
      );
    });

    await t2.step('warn', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.warn('warn').format({ color: true });
      assertEquals(result, enable.warn + 'warn' + disable.warn);
    });

    await t2.step('error', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.error('error').format({ color: true });
      assertEquals(result, enable.error + 'error' + disable.error);
    });

    await t2.step('strikethru', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.strikethru('strikethru').format({ color: true });
      assertEquals(result, enable.strikethru + 'strikethru' + disable.strikethru);
    });

    await t2.step('url', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.url('https://example.com').format({ color: true });
      assertEquals(result, enable.url + 'https://example.com' + disable.url);
    });

    await t2.step('code', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.code('const foo = 42;').format({ color: true });
      assertEquals(result, enable.code + 'const foo = 42;' + disable.code);
    });

    await t2.step('success', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.success('Operation completed').format({ color: true });
      assertEquals(result, enable.success + 'Operation completed' + disable.success);
    });

    await t2.step('dim', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.dim('secondary info').format({ color: true });
      assertEquals(result, enable.dim + 'secondary info' + disable.dim);
    });
  });

  await t.step('icon methods', async (t2) => {
    await t2.step('icheck with default color (success)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.icheck().format({ color: true });
      assertEquals(result, enable.success + '✓' + disable.success);
    });

    await t2.step('icheck with custom color', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.icheck((s: string) => '\x1b[94m' + s + '\x1b[39m').format({ color: true });
      assertEquals(result, '\x1b[94m✓\x1b[39m');
    });

    await t2.step('ialert with default color (warn)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.ialert().format({ color: true });
      assertEquals(result, enable.warn + '⚠' + disable.warn);
    });

    await t2.step('ialert with custom color', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.ialert((s: string) => '\x1b[95m' + s + '\x1b[39m').format({ color: true });
      assertEquals(result, '\x1b[95m⚠\x1b[39m');
    });

    await t2.step('ierror with default color (error)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.ierror().format({ color: true });
      assertEquals(result, enable.error + '✗' + disable.error);
    });

    await t2.step('ierror with custom color', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.ierror((s: string) => '\x1b[96m' + s + '\x1b[39m').format({ color: true });
      assertEquals(result, '\x1b[96m✗\x1b[39m');
    });

    await t2.step('iarrow with default color (value)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.iarrow().format({ color: true });
      assertEquals(result, enable.text + '→' + disable.text);
    });

    await t2.step('iarrow with custom color', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.iarrow((s: string) => '\x1b[92m' + s + '\x1b[39m').format({ color: true });
      assertEquals(result, '\x1b[92m→\x1b[39m');
    });

    await t2.step('istar with default color (highlight)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.istar().format({ color: true });
      assertEquals(result, enable.highlight + '★' + disable.highlight);
    });

    await t2.step('istar with custom color', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.istar((s: string) => '\x1b[93m' + s + '\x1b[39m').format({ color: true });
      assertEquals(result, '\x1b[93m★\x1b[39m');
    });

    await t2.step('bool method', async (t3) => {
      await t3.step('bool(true) with default preset (check)', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder.bool(true).format({ color: true });
        assertEquals(result, '\x1b[38;2;81;214;124m✓\x1b[39m');
      });

      await t3.step('bool(false) with default preset (check)', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder.bool(false).format({ color: true });
        assertEquals(result, '\x1b[38;2;239;68;68m✗\x1b[39m');
      });

      await t3.step('bool(true) with checkBold preset', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder.bool(true, 'checkBold').format({ color: true });
        assertEquals(result, '\x1b[38;2;81;214;124m✔\x1b[39m');
      });

      await t3.step('bool(false) with checkBold preset', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder.bool(false, 'checkBold').format({ color: true });
        assertEquals(result, '\x1b[38;2;239;68;68m✖\x1b[39m');
      });

      await t3.step('bool(true) with circle preset', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder.bool(true, 'circle').format({ color: true });
        assertEquals(result, '\x1b[38;2;81;214;124m●\x1b[39m');
      });

      await t3.step('bool(false) with circle preset', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder.bool(false, 'circle').format({ color: true });
        assertEquals(result, '\x1b[38;2;100;116;139m○\x1b[39m');
      });

      await t3.step('bool(true) with yesno preset', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder.bool(true, 'yesno').format({ color: true });
        assertEquals(result, '\x1b[38;2;81;214;124myes\x1b[39m');
      });

      await t3.step('bool(false) with yesno preset', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder.bool(false, 'yesno').format({ color: true });
        assertEquals(result, '\x1b[38;2;239;68;68mno\x1b[39m');
      });

      await t3.step('bool(true) with truefalse preset', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder.bool(true, 'truefalse').format({ color: true });
        assertEquals(result, '\x1b[38;2;81;214;124mtrue\x1b[39m');
      });

      await t3.step('bool(false) with truefalse preset', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder.bool(false, 'truefalse').format({ color: true });
        assertEquals(result, '\x1b[38;2;239;88;103mfalse\x1b[39m');
      });

      await t3.step('bool(true) with custom config', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder
          .bool(true, { trueChar: '👍', falseChar: '👎' })
          .format({ color: true });
        assertEquals(result, '\x1b[38;2;81;214;124m👍\x1b[39m');
      });

      await t3.step('bool(false) with custom config', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder
          .bool(false, { trueChar: '👍', falseChar: '👎' })
          .format({ color: true });
        assertEquals(result, '\x1b[38;2;239;68;68m👎\x1b[39m');
      });

      await t3.step('bool(true) with custom trueColor', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder
          .bool(true, { trueChar: '✓', falseChar: '✗', trueColor: 0x00ff00 })
          .format({ color: true });
        assertEquals(result, '\x1b[38;2;0;255;0m✓\x1b[39m');
      });

      await t3.step('bool(false) with custom falseColor', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder
          .bool(false, { trueChar: '✓', falseChar: '✗', falseColor: 0xff0000 })
          .format({ color: true });
        assertEquals(result, '\x1b[38;2;255;0;0m✗\x1b[39m');
      });

      await t3.step('bool(true) without colors', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder.bool(true).format({ color: false });
        assertEquals(result, '✓');
      });

      await t3.step('bool(false) without colors', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder.bool(false).format({ color: false });
        assertEquals(result, '✗');
      });

      await t3.step('bool method chains with other methods', () => {
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder.text('Result:').bool(true).format({ color: false });
        assertEquals(result, 'Result: ✓');
      });
    });
  });

  await t.step('err method', async (t2) => {
    const err = new Error('message');
    const errOpts = { code: 32, path: `${home}/relative/to/home`, cause: 'unit tests' };
    Object.assign(err, errOpts);

    await t2.step('default minus stack', () => {
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

    await t2.step('default minus stack, cause', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.err(err, { stack: false, cause: false }).format({ color: true });
      assertEquals(
        result,
        enable.error + 'message' + disable.error + ' ' + enable.path + '~/relative/to/home' + disable.path,
      );
    });

    await t2.step('default minus stack, path plus code', () => {
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

  await t.step('count method for pluralization', async (t2) => {
    await t2.step('singular with one argument: appends nothing', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(1).h2('message').format({ color: false });
      assertEquals(result, '1 message');
    });

    await t2.step('plural with one argument: appends "s"', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(2).h2('message').format({ color: false });
      assertEquals(result, '2 messages');
    });

    await t2.step('zero with one argument: appends "s"', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(0).h2('message').format({ color: false });
      assertEquals(result, '0 messages');
    });

    await t2.step('singular with two arguments: uses first string', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(1).h2('entry', 'entries').format({ color: false });
      assertEquals(result, '1 entry');
    });

    await t2.step('plural with two arguments: uses second string', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(5).h2('entry', 'entries').format({ color: false });
      assertEquals(result, '5 entries');
    });

    await t2.step('only applies to the next method call', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(10).h2('message').h2('inbox').format({ color: false });
      assertEquals(result, '10 messages inbox');
    });

    await t2.step('does not pluralize for non-integer counts', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.count(1.5).h2('message').format({ color: false });
      assertEquals(result, '1.5 message');
    });
  });

  await t.step('standalone usage', async (t2) => {
    await t2.step('can be instantiated without arguments', () => {
      const builder = new MsgBuilder.Console.Builder();
      const result = builder.h1('Hello').text('World').format({ color: false });
      assertEquals(result, 'Hello World');
    });

    await t2.step('format with msgSep=0 joins parts with no space', () => {
      const builder = new MsgBuilder.Console.Builder();
      const result = builder.h1('Hello').text('World').format({ color: false, msgSep: 0 });
      assertEquals(result, 'HelloWorld');
    });

    await t2.step('format with msgSep=1 joins parts with single space (default)', () => {
      const builder = new MsgBuilder.Console.Builder();
      const result = builder.h1('Hello').text('World').format({ color: false, msgSep: 1 });
      assertEquals(result, 'Hello World');
    });

    await t2.step('format with msgSep=3 joins parts with three spaces', () => {
      const builder = new MsgBuilder.Console.Builder();
      const result = builder.h1('Hello').text('World').value('!').format({ color: false, msgSep: 3 });
      assertEquals(result, 'Hello   World   !');
    });

    await t2.step('format without msgSep defaults to single space', () => {
      const builder = new MsgBuilder.Console.Builder();
      const result = builder.h1('A').text('B').format({ color: false });
      assertEquals(result, 'A B');
    });

    await t2.step('emit() outputs with color', () => {
      const tester = new MsgBuilder.TestEmitter();
      const builder = new MsgBuilder.Console.Builder(tester);
      const result = builder.h2('test').emit();
      assert(result !== undefined);
      if (result) {
        assertFalse(result.data);
        assert(result.timestamp instanceof DateTime);
        assert(result.formatter instanceof MsgBuilder.Console.Builder);
        assertEquals(tester.output, enable.h2 + 'test' + disable.h2);
      }
    });

    await t2.step('emit() outputs with nocolor', () => {
      const tester = new MsgBuilder.TestEmitter();
      tester.color = false;
      const builder = new MsgBuilder.Console.Builder(tester);
      const result = builder.text('test').emit();
      assert(result !== undefined);
      if (result) {
        assertFalse(result.data);
        assert(result.timestamp instanceof DateTime);
        assert(result.formatter instanceof MsgBuilder.Console.Builder);
        assertEquals(tester.output, 'test');
      }
    });
  });

  await t.step('style map configuration', async (t2) => {
    const originalStyles = MsgBuilder.Console.Builder.styleFormatters;

    await t2.step('can swap global style theme', () => {
      // Swap to V1 theme
      MsgBuilder.Console.Builder.styleFormatters = MsgBuilder.Console.styleFormattersV1;

      // Verify V1 is now active (h1 uses bold + magenta in V1)
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.h1('test').format({ color: false });
      assertEquals(result, 'test');

      // The static property was changed
      assertEquals(
        MsgBuilder.Console.Builder.styleFormatters,
        MsgBuilder.Console.styleFormattersV1,
      );

      // Restore original
      MsgBuilder.Console.Builder.styleFormatters = originalStyles;
    });

    await t2.step('subclass can have its own style theme', () => {
      // Create a subclass with the default (RGB) theme
      class RgbBuilder extends MsgBuilder.Console.Builder {
        static override styleFormatters = MsgBuilder.Console.styleFormatters;
      }

      // Verify subclass uses the default theme
      const subclassBuilder = new RgbBuilder();
      const result = subclassBuilder.h1('test').format({ color: false });
      assertEquals(result, 'test');

      // Verify parent still has V0 (set at top of this file)
      assertEquals(MsgBuilder.Console.Builder.styleFormatters, originalStyles);
    });
  });
});
