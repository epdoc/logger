import { assertEquals, assertThrows } from '@std/assert';
import { describe, test } from '@std/testing/bdd';
import { reset, set } from '../../../test-utils/color-map.ts';
import * as Log from '../src/mod.ts';

describe('levels', () => {
  describe('cli', () => {
    test('values', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assertEquals(logLevels.asValue('error'), 17);
      assertEquals(logLevels.asValue('warn'), 13);
      assertEquals(logLevels.asValue('help'), 11);
      assertEquals(logLevels.asValue('data'), 10);
      assertEquals(logLevels.asValue('info'), 9);
      assertEquals(logLevels.asValue('debug'), 5);
      assertEquals(logLevels.asValue('prompt'), 4);
      assertEquals(logLevels.asValue('verbose'), 3);
      assertEquals(logLevels.asValue('input'), 2);
      assertEquals(logLevels.asValue('silly'), 1);
      assertEquals(logLevels.asName(1), 'SILLY');
      assertEquals(logLevels.asName(2), 'INPUT');
      assertEquals(logLevels.asName(3), 'VERBOSE');
      assertEquals(logLevels.asName(4), 'PROMPT');
      assertEquals(logLevels.asName(5), 'DEBUG');
      assertEquals(logLevels.asName(9), 'INFO');
      assertEquals(logLevels.asName(10), 'DATA');
      assertEquals(logLevels.asName(11), 'HELP');
      assertEquals(logLevels.asName(13), 'WARN');
      assertEquals(logLevels.asName(17), 'ERROR');
    });

    test('cli threshold', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      // For increasing levels: level meets threshold if level >= threshold
      assertEquals(logLevels.meetsThreshold('prompt', 'prompt'), true);
      assertEquals(logLevels.meetsThreshold('prompt', 'verbose'), true);
      assertEquals(logLevels.meetsThreshold('verbose', 'prompt'), false);
      assertEquals(logLevels.meetsThreshold(3, 4), false);
      assertEquals(logLevels.meetsThreshold('prompt', 'silly'), true);
    });

    test('cli flush threshold', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assertEquals(logLevels.meetsFlushThreshold('error'), true);
      assertEquals(logLevels.meetsFlushThreshold('warn'), false);
      assertEquals(logLevels.meetsFlushThreshold('help'), false);
      assertEquals(logLevels.meetsFlushThreshold('data'), false);
      assertEquals(logLevels.meetsFlushThreshold('info'), false);
      assertEquals(logLevels.meetsFlushThreshold('debug'), false);
      assertEquals(logLevels.meetsFlushThreshold('prompt'), false);
      assertEquals(logLevels.meetsFlushThreshold('verbose'), false);
      assertEquals(logLevels.meetsFlushThreshold('input'), false);
      assertEquals(logLevels.meetsFlushThreshold('silly'), false);
    });

    test('cli applyColors', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assertEquals(logLevels.applyColors('test', 'ERROR'), set.redText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'WARN'), set.yellowText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'HELP'), set.cyanText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'DATA'), set.grayText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'INFO'), set.greenText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'DEBUG'), set.blueText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'PROMPT'), set.grayText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'VERBOSE'), set.cyanText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'INPUT'), set.grayText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'SILLY'), set.magentaText + 'test' + reset.fg);
    });
  });

  describe('std', () => {
    test('values', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      assertEquals(logLevels.asValue('fatal'), 22);
      assertEquals(logLevels.asValue('critical'), 21);
      assertEquals(logLevels.asValue('error'), 17);
      assertEquals(logLevels.asValue('warn'), 13);
      assertEquals(logLevels.asValue('info'), 9);
      assertEquals(logLevels.asValue('verbose'), 6);
      assertEquals(logLevels.asValue('debug'), 5);
      assertEquals(logLevels.asValue('trace'), 4);
      assertEquals(logLevels.asValue('spam'), 2);
      assertEquals(logLevels.asName(2), 'SPAM');
      assertEquals(logLevels.asName(4), 'TRACE');
      assertEquals(logLevels.asName(5), 'DEBUG');
      assertEquals(logLevels.asName(6), 'VERBOSE');
      assertEquals(logLevels.asName(9), 'INFO');
      assertEquals(logLevels.asName(13), 'WARN');
      assertEquals(logLevels.asName(17), 'ERROR');
      assertEquals(logLevels.asName(22), 'FATAL');
    });

    test('std threshold', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      // For increasing levels: level meets threshold if level >= threshold
      assertEquals(logLevels.meetsThreshold(4, 4), true);
      assertEquals(logLevels.meetsThreshold(4, 5), false);
      assertEquals(logLevels.meetsThreshold(5, 4), true);
      assertEquals(logLevels.meetsThreshold(4, 2), true);
    });

    test('std flush threshold', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      assertEquals(logLevels.meetsFlushThreshold('fatal'), true);
      assertEquals(logLevels.meetsFlushThreshold('critical'), true);
      assertEquals(logLevels.meetsFlushThreshold('error'), true);
      assertEquals(logLevels.meetsFlushThreshold('warn'), false);
      assertEquals(logLevels.meetsFlushThreshold('info'), false);
      assertEquals(logLevels.meetsFlushThreshold('verbose'), false);
      assertEquals(logLevels.meetsFlushThreshold('debug'), false);
      assertEquals(logLevels.meetsFlushThreshold('trace'), false);
      assertEquals(logLevels.meetsFlushThreshold('spam'), false);
    });

    test('std applyColors', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      assertEquals(logLevels.applyColors('test', 'FATAL'), set.brightRedText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'CRITICAL'), set.brightRedText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'ERROR'), set.redText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'WARN'), set.yellowText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'INFO'), set.greenText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'VERBOSE'), set.cyanText + 'test' + reset.fg);
      assertEquals(
        logLevels.applyColors('test', 'DEBUG'),
        '\u001b[2m' + set.blueText + 'test' + reset.fg + '\u001b[22m',
      );
      assertEquals(logLevels.applyColors('test', 'TRACE'), set.grayText + 'test' + reset.fg);
      assertEquals(
        logLevels.applyColors('test', 'SPAM'),
        '\u001b[2m' + set.grayText + 'test' + reset.fg + '\u001b[22m',
      );
    });
  });

  describe('min', () => {
    test('values', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      assertEquals(logLevels.asValue('error'), 17);
      assertEquals(logLevels.asValue('warn'), 13);
      assertEquals(logLevels.asValue('info'), 9);
      assertEquals(logLevels.asValue('debug'), 5);
      assertEquals(logLevels.asName(5), 'DEBUG');
      assertEquals(logLevels.asName(9), 'INFO');
      assertEquals(logLevels.asName(13), 'WARN');
      assertEquals(logLevels.asName(17), 'ERROR');
    });

    test('std threshold', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      // For increasing levels: level meets threshold if level >= threshold
      assertEquals(logLevels.meetsThreshold(17, 13), true);
      assertEquals(logLevels.meetsThreshold(13, 13), true);
      assertEquals(logLevels.meetsThreshold(5, 9), false);
      assertEquals(logLevels.meetsThreshold(5, 13), false);
      assertThrows(
        () => logLevels.meetsThreshold(3, 13),
        Error,
        'Cannot get log level: no name for level: 3',
      );
    });

    test('std flush threshold', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      assertEquals(logLevels.meetsFlushThreshold('error'), true);
      assertEquals(logLevels.meetsFlushThreshold('warn'), false);
      assertEquals(logLevels.meetsFlushThreshold('info'), false);
      assertEquals(logLevels.meetsFlushThreshold('debug'), false);
    });

    test('std applyColors', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      assertEquals(logLevels.applyColors('test', 'ERROR'), set.redText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'WARN'), set.yellowText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'INFO'), set.greenText + 'test' + reset.fg);
      assertEquals(
        logLevels.applyColors('test', 'DEBUG'),
        '\u001b[2m' + set.blueText + 'test' + reset.fg + '\u001b[22m',
      );
    });
  });
});
