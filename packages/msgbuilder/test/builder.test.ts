import { assertEquals } from '@std/assert';
import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import os from 'node:os';
import { disable, enable } from '../../../test-utils/color-map.ts';
import * as MsgBuilder from '../src/mod.ts';

const home = os.userInfo().homedir;

// Pin tests to the V0 (original) style map so that the hardcoded ANSI
// sequences in color-map.ts continue to match.
MsgBuilder.Console.Builder.styleFormatters = MsgBuilder.Console.styleFormattersV0;

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
      expect(result).toMatch(
        /^.*h1.*h2.*h3.*action.*label.*highlight.*value.*url.*path.*code.*date.*success.*strikethru.*warn.*error.*$/,
      );
      const r2 = builder.format({ color: false });
      console.log(r2);
      expect(r2).toEqual('h1 h2 h3 action label highlight value url path code date success strikethru warn error');
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
      assertEquals(result, 'h1 h2 h3 action label highlight value url path code date success strikethru warn error');
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
      assertEquals(result, enable.label + 'label' + disable.label);
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
    test('date with string (fallback)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.date('date').format({ color: true });
      assertEquals(result, enable.date + 'date' + disable.date);
    });
    test('date with Date object (default format)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const testDate = new Date('2024-03-15T10:30:45.000Z');
      const result = msgBuilder.date(testDate).format({ color: false });
      // Result will be in local timezone, so we just check it's formatted
      assertEquals(result.length > 0, true);
      assertEquals(result.includes('2024'), true);
    });
    test('date with Date object (custom format)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const testDate = new Date('2024-03-15T10:30:45.000Z');
      const result = msgBuilder.date(testDate, 'yyyy-MM-dd').format({ color: false });
      assertEquals(result.includes('2024-03-15'), true);
    });
    test('date with Date object (options with tz)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const testDate = new Date('2024-03-15T10:30:45.000Z');
      const result = msgBuilder.date(testDate, { format: 'HH:mm', tz: 'utc' }).format({ color: false });
      assertEquals(result, '10:30');
    });
    test('date with Temporal.Instant', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const instant = Temporal.Instant.from('2024-03-15T10:30:45.000Z');
      const result = msgBuilder.date(instant, { format: 'yyyy-MM-dd', tz: 'utc' }).format({ color: false });
      assertEquals(result, '2024-03-15');
    });
    test('date with Temporal.ZonedDateTime', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const zdt = Temporal.ZonedDateTime.from('2024-03-15T10:30:45.000Z[UTC]');
      const result = msgBuilder.date(zdt, { format: 'HH:mm:ss', tz: 'utc' }).format({ color: false });
      assertEquals(result, '10:30:45');
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
    test('url', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.url('https://example.com').format({ color: true });
      assertEquals(result, enable.url + 'https://example.com' + disable.url);
    });
    test('code', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.code('const foo = 42;').format({ color: true });
      assertEquals(result, enable.code + 'const foo = 42;' + disable.code);
    });
    test('success', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.success('Operation completed').format({ color: true });
      assertEquals(result, enable.success + 'Operation completed' + disable.success);
    });
    test('dim', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.dim('secondary info').format({ color: true });
      assertEquals(result, enable.dim + 'secondary info' + disable.dim);
    });
  });
  describe('icon methods', () => {
    test('icheck with default color (success)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.icheck().format({ color: true });
      assertEquals(result, enable.success + '✓' + disable.success);
    });
    test('icheck with custom color', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.icheck((s: string) => '\x1b[94m' + s + '\x1b[39m').format({ color: true });
      assertEquals(result, '\x1b[94m✓\x1b[39m');
    });
    test('ialert with default color (warn)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.ialert().format({ color: true });
      assertEquals(result, enable.warn + '⚠' + disable.warn);
    });
    test('ialert with custom color', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.ialert((s: string) => '\x1b[95m' + s + '\x1b[39m').format({ color: true });
      assertEquals(result, '\x1b[95m⚠\x1b[39m');
    });
    test('ierror with default color (error)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.ierror().format({ color: true });
      assertEquals(result, enable.error + '✗' + disable.error);
    });
    test('ierror with custom color', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.ierror((s: string) => '\x1b[96m' + s + '\x1b[39m').format({ color: true });
      assertEquals(result, '\x1b[96m✗\x1b[39m');
    });
    test('iarrow with default color (value)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.iarrow().format({ color: true });
      assertEquals(result, enable.value + '→' + disable.value);
    });
    test('iarrow with custom color', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.iarrow((s: string) => '\x1b[92m' + s + '\x1b[39m').format({ color: true });
      assertEquals(result, '\x1b[92m→\x1b[39m');
    });
    test('istar with default color (highlight)', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.istar().format({ color: true });
      assertEquals(result, enable.highlight + '★' + disable.highlight);
    });
    test('istar with custom color', () => {
      const msgBuilder = new MsgBuilder.Console.Builder();
      const result = msgBuilder.istar((s: string) => '\x1b[93m' + s + '\x1b[39m').format({ color: true });
      assertEquals(result, '\x1b[93m★\x1b[39m');
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

    test('format with msgSep=0 joins parts with no space', () => {
      const builder = new MsgBuilder.Console.Builder();
      const result = builder.h1('Hello').text('World').format({ color: false, msgSep: 0 });
      assertEquals(result, 'HelloWorld');
    });

    test('format with msgSep=1 joins parts with single space (default)', () => {
      const builder = new MsgBuilder.Console.Builder();
      const result = builder.h1('Hello').text('World').format({ color: false, msgSep: 1 });
      assertEquals(result, 'Hello World');
    });

    test('format with msgSep=3 joins parts with three spaces', () => {
      const builder = new MsgBuilder.Console.Builder();
      const result = builder.h1('Hello').text('World').value('!').format({ color: false, msgSep: 3 });
      assertEquals(result, 'Hello   World   !');
    });

    test('format without msgSep defaults to single space', () => {
      const builder = new MsgBuilder.Console.Builder();
      const result = builder.h1('A').text('B').format({ color: false });
      assertEquals(result, 'A B');
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
  describe('style map configuration', () => {
    const originalStyles = MsgBuilder.Console.Builder.styleFormatters;

    test('can swap global style theme', () => {
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

    test('subclass can have its own style theme', () => {
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
