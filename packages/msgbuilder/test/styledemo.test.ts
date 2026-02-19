import { assertEquals } from '@std/assert';
import { expect } from '@std/expect';
import { afterAll, beforeAll, describe, test } from '@std/testing/bdd';
import * as MsgBuilder from '../src/mod.ts';

/**
 * Generates sample text that exercises all console style formatters.
 * Creates a cohesive narrative (deployment log) demonstrating each style.
 */
function sampleText(msg: MsgBuilder.Console.Builder): string {
  // Main headers
  msg.h1('\nApplication Deployment Log (h1)');

  // Section header
  msg.h2('\n\nBuild Configuration (h2)');

  // Subsection
  msg.h3('\nEnvironment Settings (h3)');

  // Body text with various elements
  msg.text('\nStarting deployment process at ').date('2025-02-20 14:30:45').text('. ');
  msg.text('The').bold('build system').text('will').action('compile (action)').text(' and ').action('deploy');
  msg.text(' the application to production. (text)');

  // Key-value pairs with labels and values
  msg.text('\n\n').label('Project: ').value('@epdoc/logger');
  msg.label('\nLabel: ').value('v2.5.0 (value)');
  msg.label('\nEnvironment: ').highlight('production (highlight)');
  msg.label('\nBuild ID: ').code('abc123def456 (code)');

  // File paths and URLs
  msg.text('\n\nSource files located at ').path('/format/as/path/auth.ts');
  msg.text('\nDocumentation available at ').url('https://docs.epdoc.dev/format/as/url');

  // Status messages
  msg.h3('\n\nBuild Status');
  msg.success('\n✓ Dependencies installed successfully (success)');
  msg.success('\n✓ TypeScript compilation completed');
  msg.warn('\n⚠ Deprecated API usage detected in (warn)').path('/format/as/path/legacy.ts');
  msg.error('\n✗ Failed to optimize bundle error');

  // Highlight important info
  msg.highlight('\n\nImportant: ').text('Review ').strikethru('old strikethru').text(' before proceeding.');

  // Technical details
  msg.dim('\n\nDebug information (dim):');
  msg.dim('\n  - Memory usage: 142MB');
  msg.dim('\n  - Build time: 3m 42s');
  msg.dim('\n  - Worker threads: 4');

  // Bold text
  msg.bold('\n\nCritical notice (bold):');
  msg.bold('\n  Ensure all tests pass before merge.');

  // Action items
  msg.text('\n\nNext steps: ').action('Run tests').text(' → ').action('Deploy to staging').text(' → ');
  msg.action('Monitor metrics (action)');

  return msg.format();
}

describe('MsgBuilder.Console', () => {
  describe('style formatters comparison', () => {
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
        console.log(`\n${s.name}\n`);
        MsgBuilder.Console.Builder.styleFormatters = s.style;
        const msgBuilder = new MsgBuilder.Console.Builder();
        const result = sampleText(msgBuilder);
        // const result = msgBuilder
        //   .h1(s.name)
        //   .text(' - ')
        //   .label('label')
        //   .value('value')
        //   .path('/example/path')
        //   .success('success')
        //   .warn('warn')
        //   .error('error')
        //   .format({ color: true });

        console.log(result);
        console.log('');

        // Verify that colors are applied (should contain ANSI escape codes)
        expect(result).not.toEqual(expect.stringContaining(s.name + ' - label value /example/path success warn error'));
        expect(result).toContain('\x1b'); // ANSI escape sequence start
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
        .dim('dim')
        .bold('bold')
        .format({ color: false });

      console.log(result);
      console.log('');

      // Verify no ANSI codes when color is false
      assertEquals(
        result,
        'h1 h2 h3 action label highlight value url path code date success strikethru warn error dim bold',
      );
      expect(result).not.toContain('\x1b');

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
        .error('error')
        .dim('dim')
        .bold('bold');
      const result = builder.format({ color: true });
      console.log(result);
      expect(result).toMatch(
        /^.*h1.*h2.*h3.*action.*label.*highlight.*value.*url.*path.*code.*date.*success.*strikethru.*warn.*error.*dim.*bold.*$/,
      );
      const r2 = builder.format({ color: false });
      console.log(r2);
      expect(r2).toEqual(
        'h1 h2 h3 action label highlight value url path code date success strikethru warn error dim bold',
      );
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
        .dim('dim')
        .bold('bold')
        .format({ color: false });
      console.log(result);
      assertEquals(
        result,
        'h1 h2 h3 action label highlight value url path code date success strikethru warn error dim bold',
      );
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
