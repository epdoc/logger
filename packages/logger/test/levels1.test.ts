import { applyColors } from '@epdoc/loglevels';
import { assertEquals, assertObjectMatch } from '@std/assert';
import { describe, test } from '@std/testing/bdd';
import { reset, set } from '../../../test-utils/color-map.ts';
import * as Log from '../src/mod.ts';

describe('levels', () => {
  describe('cli', () => {
    test('values', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assertEquals(logLevels.asSpec('error')!.severity, 17);
      assertEquals(logLevels.asSpec('warn')!.severity, 13);
      assertEquals(logLevels.asSpec('help')!.severity, 11);
      assertEquals(logLevels.asSpec('data')!.severity, 10);
      assertEquals(logLevels.asSpec('info')!.severity, 9);
      assertEquals(logLevels.asSpec('debug')!.severity, 5);
      assertEquals(logLevels.asSpec('prompt')!.severity, 4);
      assertEquals(logLevels.asSpec('verbose')!.severity, 3);
      assertEquals(logLevels.asSpec('input')!.severity, 2);
      assertEquals(logLevels.asSpec('silly')!.severity, 1);
      assertEquals(logLevels.asSpec(1)!.name, 'SILLY');
      assertEquals(logLevels.asSpec(2)!.name, 'INPUT');
      assertEquals(logLevels.asSpec(3)!.name, 'VERBOSE');
      assertEquals(logLevels.asSpec(4)!.name, 'PROMPT');
      assertEquals(logLevels.asSpec(5)!.name, 'DEBUG');
      assertEquals(logLevels.asSpec(9)!.name, 'INFO');
      assertEquals(logLevels.asSpec(10)!.name, 'DATA');
      assertEquals(logLevels.asSpec(11)!.name, 'HELP');
      assertEquals(logLevels.asSpec(13)!.name, 'WARN');
      assertEquals(logLevels.asSpec(17)!.name, 'ERROR');
    });

    test('cli threshold', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      // For increasing levels: level meets threshold if level >= threshold
      assertEquals(logLevels.asSpec('prompt')!.severity >= logLevels.asSpec('prompt')!.severity, true);
      assertEquals(logLevels.asSpec('prompt')!.severity >= logLevels.asSpec('verbose')!.severity, true);
      assertEquals(logLevels.asSpec('verbose')!.severity >= logLevels.asSpec('prompt')!.severity, false);
      assertEquals(logLevels.asSpec(3)!.severity >= logLevels.asSpec(4)!.severity, false);
      assertEquals(logLevels.asSpec('prompt')!.severity >= logLevels.asSpec('silly')!.severity, true);
    });

    test('cli flush threshold', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assertEquals(logLevels.asSpec('error')!.severity >= logLevels.flushLevel.severity, true);
      assertEquals(logLevels.asSpec('warn')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('help')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('data')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('info')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('debug')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('prompt')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('verbose')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('input')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('silly')!.severity >= logLevels.flushLevel.severity, false);
    });

    test('cli applyColors', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assertEquals(applyColors('test', logLevels.asSpec('ERROR')!), set.redText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('WARN')!), set.yellowText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('HELP')!), set.cyanText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('DATA')!), set.grayText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('INFO')!), set.greenText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('DEBUG')!), set.blueText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('PROMPT')!), set.grayText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('VERBOSE')!), set.cyanText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('INPUT')!), set.grayText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('SILLY')!), set.magentaText + 'test' + reset.fg);
    });
  });

  describe('std', () => {
    test('values', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      assertEquals(logLevels.asSpec('fatal')!.severity, 22);
      assertEquals(logLevels.asSpec('critical')!.severity, 21);
      assertEquals(logLevels.asSpec('error')!.severity, 17);
      assertEquals(logLevels.asSpec('warn')!.severity, 13);
      assertEquals(logLevels.asSpec('info')!.severity, 9);
      assertEquals(logLevels.asSpec('verbose')!.severity, 6);
      assertEquals(logLevels.asSpec('debug')!.severity, 5);
      assertEquals(logLevels.asSpec('trace')!.severity, 4);
      assertEquals(logLevels.asSpec('spam')!.severity, 2);
      assertEquals(logLevels.asSpec(2)!.name, 'SPAM');
      assertEquals(logLevels.asSpec(4)!.name, 'TRACE');
      assertEquals(logLevels.asSpec(5)!.name, 'DEBUG');
      assertEquals(logLevels.asSpec(6)!.name, 'VERBOSE');
      assertEquals(logLevels.asSpec(9)!.name, 'INFO');
      assertEquals(logLevels.asSpec(13)!.name, 'WARN');
      assertEquals(logLevels.asSpec(17)!.name, 'ERROR');
      assertEquals(logLevels.asSpec(22)!.name, 'FATAL');
    });

    test('std threshold', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      // For increasing levels: level meets threshold if level >= threshold
      assertEquals(logLevels.asSpec(4)!.severity >= 3, true);
      assertEquals(logLevels.asSpec(4)!.severity >= 4, true);
      assertEquals(logLevels.asSpec(5)!.severity > 4, true);
      assertEquals(logLevels.asSpec(4)!.severity > 4, false);
    });

    test('std flush threshold', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      assertEquals(logLevels.asSpec('fatal')!.severity >= logLevels.flushLevel.severity, true);
      assertEquals(logLevels.asSpec('critical')!.severity >= logLevels.flushLevel.severity, true);
      assertEquals(logLevels.asSpec('error')!.severity >= logLevels.flushLevel.severity, true);
      assertEquals(logLevels.asSpec('warn')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('info')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('verbose')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('debug')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('trace')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('spam')!.severity >= logLevels.flushLevel.severity, false);
    });

    test('std applyColors', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      assertEquals(applyColors('test', logLevels.asSpec('FATAL')), set.brightRedText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('CRITICAL')), set.brightRedText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('ERROR')), set.redText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('WARN')), set.yellowText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('INFO')), set.greenText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('VERBOSE')), set.cyanText + 'test' + reset.fg);
      assertEquals(
        applyColors('test', logLevels.asSpec('DEBUG')),
        '\u001b[2m' + set.blueText + 'test' + reset.fg + '\u001b[22m',
      );
      assertEquals(applyColors('test', logLevels.asSpec('TRACE')), set.grayText + 'test' + reset.fg);
      assertEquals(
        applyColors('test', logLevels.asSpec('SPAM')),
        '\u001b[2m' + set.grayText + 'test' + reset.fg + '\u001b[22m',
      );
    });
  });

  describe('min', () => {
    test('values', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      assertObjectMatch(logLevels.asSpec('error')!, { severity: 17, name: 'ERROR' });
      assertObjectMatch(logLevels.asSpec('warn')!, { severity: 13, name: 'WARN' });
      assertObjectMatch(logLevels.asSpec('info')!, { severity: 9, name: 'INFO' });
      assertObjectMatch(logLevels.asSpec('debug')!, { severity: 5, name: 'DEBUG' });
      assertObjectMatch(logLevels.asSpec(5)!, { name: 'DEBUG', severity: 5 });
      assertObjectMatch(logLevels.asSpec(9)!, { name: 'INFO', severity: 9 });
      assertObjectMatch(logLevels.asSpec(13)!, { name: 'WARN', severity: 13 });
      assertObjectMatch(logLevels.asSpec(17)!, { name: 'ERROR', severity: 17 });
    });

    test('std threshold', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      // For increasing levels: level meets threshold if level >= threshold
      assertEquals(logLevels.asSpec(17)!.severity >= 13, true);
      assertEquals(logLevels.asSpec(13)!.severity >= 13, true);
      assertEquals(logLevels.asSpec(5)!.severity >= 9, false);
      assertEquals(logLevels.asSpec(5)!.severity >= 13, false);
      assertEquals(logLevels.asSpec('wild'), null);
    });

    test('std flush threshold', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      assertEquals(logLevels.asSpec('error')!.severity >= logLevels.flushLevel.severity, true);
      assertEquals(logLevels.asSpec('warn')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('info')!.severity >= logLevels.flushLevel.severity, false);
      assertEquals(logLevels.asSpec('debug')!.severity >= logLevels.flushLevel.severity, false);
    });

    test('std applyColors', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      assertEquals(applyColors('test', logLevels.asSpec('ERROR')), set.redText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('WARN')), set.yellowText + 'test' + reset.fg);
      assertEquals(applyColors('test', logLevels.asSpec('INFO')), set.greenText + 'test' + reset.fg);
      assertEquals(
        applyColors('test', logLevels.asSpec('DEBUG')!),
        '\u001b[2m' + set.blueText + 'test' + reset.fg + '\u001b[22m',
      );
    });
  });
});
