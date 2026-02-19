import { assertEquals } from '@std/assert';
import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, test } from '@std/testing/bdd';
import os from 'node:os';
import * as MsgBuilder from '../src/mod.ts';

const home = os.userInfo().homedir;

describe('MsgBuilder.Console', () => {
  describe('style formatters comparison', () => {
    test('default style formatters with colors (full demonstration)', () => {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║   DEFAULT STYLE (24-bit RGB) - Full Style Demonstration    ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      MsgBuilder.Console.Builder.styleFormatters = MsgBuilder.Console.styleFormatters;
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
        .format({ color: true });

      console.log(result);
      console.log('');

      // Verify that colors are applied (should contain ANSI escape codes)
      expect(result).not.toEqual('h1 h2 h3 action label highlight value url path code date success strikethru warn error');
      expect(result).toMatch(/\x1b\[|\u001b\[/); // ANSI escape sequences
    });

    test('all three style formatters with colors (compact)', () => {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║   STYLE FORMATTER COMPARISON (with colors)                 ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      const styles = [
        { name: 'Default (24-bit RGB)', style: MsgBuilder.Console.styleFormatters },
        { name: 'V0 (Standard ANSI)', style: MsgBuilder.Console.styleFormattersV0 },
        { name: 'V1 (High-contrast ANSI)', style: MsgBuilder.Console.styleFormattersV1 },
      ];

      for (const s of styles) {
        MsgBuilder.Console.Builder.styleFormatters = s.style;
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = msgBuilder
          .h1(s.name)
          .text(' - ')
          .label('label')
          .value('value')
          .path('/example/path')
          .success('success')
          .warn('warn')
          .error('error')
          .format({ color: true });

        console.log(result);
        console.log('');

        // Verify that colors are applied (should contain ANSI escape codes)
        expect(result).not.toEqual(expect.stringContaining(s.name + ' - label value /example/path success warn error'));
        expect(result).toMatch(/\x1b\[|\u001b\[/); // ANSI escape sequences
      }

      // Reset to default
      MsgBuilder.Console.Builder.styleFormatters = MsgBuilder.Console.styleFormatters;
    });

    test('no-colors mode demonstration', () => {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║   NO-COLORS MODE (using V0 theme)                          ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      // Use V0 theme for no-colors demo
      MsgBuilder.Console.Builder.styleFormatters = MsgBuilder.Console.styleFormattersV0;
      
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
      console.log('');

      // Verify no ANSI codes when color is false
      assertEquals(result, 'h1 h2 h3 action label highlight value url path code date success strikethru warn error');
      expect(result).not.toMatch(/\x1b\[|\u001b\[/);

      // Reset to default
      MsgBuilder.Console.Builder.styleFormatters = MsgBuilder.Console.styleFormatters;
    });
  });

  describe('general', () => {
    // Save and restore the original style formatters
    let originalStyleFormatters: typeof MsgBuilder.Console.Builder.styleFormatters;

    beforeAll(() => {
      originalStyleFormatters = MsgBuilder.Console.Builder.styleFormatters;
    });

    afterAll(() => {
      MsgBuilder.Console.Builder.styleFormatters = originalStyleFormatters;
    });

    test('display applyColors', () => {
      // Pin tests to the V0 (original) style map so that the hardcoded ANSI
      // sequences in color-map.ts continue to match.
      MsgBuilder.Console.Builder.styleFormatters = MsgBuilder.Console.styleFormattersV0;

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
      MsgBuilder.Console.Builder.styleFormatters = MsgBuilder.Console.styleFormattersV0;

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
      MsgBuilder.Console.Builder.styleFormatters = MsgBuilder.Console.styleFormattersV0;

      const msgBuilder = new MsgBuilder.Console.Builder();
      const str = msgBuilder.value('value').format();
      console.log(str);
      assertEquals(true, /value/.test(str));
    });
  });
});
