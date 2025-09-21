import { assertEquals } from '@std/assert';
import { describe, test } from '@std/testing/bdd';
import { set, reset } from '../../../test-utils/color-map.ts';
import * as Log from '../src/mod.ts';

describe('levels', () => {
  describe('cli', () => {
    test('values', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assertEquals(logLevels.asValue('error'), 0);
      assertEquals(logLevels.asValue('warn'), 1);
      assertEquals(logLevels.asValue('help'), 2);
      assertEquals(logLevels.asValue('data'), 3);
      assertEquals(logLevels.asValue('info'), 4);
      assertEquals(logLevels.asValue('debug'), 5);
      assertEquals(logLevels.asValue('prompt'), 6);
      assertEquals(logLevels.asValue('verbose'), 7);
      assertEquals(logLevels.asValue('input'), 8);
      assertEquals(logLevels.asValue('silly'), 9);
      assertEquals(logLevels.asName(9), 'SILLY');
      assertEquals(logLevels.asName(8), 'INPUT');
      assertEquals(logLevels.asName(7), 'VERBOSE');
      assertEquals(logLevels.asName(6), 'PROMPT');
      assertEquals(logLevels.asName(5), 'DEBUG');
      assertEquals(logLevels.asName(4), 'INFO');
      assertEquals(logLevels.asName(3), 'DATA');
      assertEquals(logLevels.asName(2), 'HELP');
      assertEquals(logLevels.asName(1), 'WARN');
      assertEquals(logLevels.asName(0), 'ERROR');
    });

    test('cli threshold', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      // For increasing levels: level meets threshold if level >= threshold
      assertEquals(logLevels.meetsThreshold(4, 4), true);  // level 4 >= threshold 4
      assertEquals(logLevels.meetsThreshold(4, 5), false); // level 4 < threshold 5
      assertEquals(logLevels.meetsThreshold(5, 4), true);  // level 5 >= threshold 4
      assertEquals(logLevels.meetsThreshold(4, 2), true);  // level 4 >= threshold 2
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
      assertEquals(logLevels.asValue('fatal'), 0);
      assertEquals(logLevels.asValue('critical'), 0);
      assertEquals(logLevels.asValue('error'), 1);
      assertEquals(logLevels.asValue('warn'), 2);
      assertEquals(logLevels.asValue('info'), 3);
      assertEquals(logLevels.asValue('verbose'), 4);
      assertEquals(logLevels.asValue('debug'), 5);
      assertEquals(logLevels.asValue('trace'), 6);
      assertEquals(logLevels.asValue('spam'), 7);
      assertEquals(logLevels.asName(7), 'SPAM');
      assertEquals(logLevels.asName(6), 'TRACE');
      assertEquals(logLevels.asName(5), 'DEBUG');
      assertEquals(logLevels.asName(4), 'VERBOSE');
      assertEquals(logLevels.asName(3), 'INFO');
      assertEquals(logLevels.asName(2), 'WARN');
      assertEquals(logLevels.asName(1), 'ERROR');
      assertEquals(logLevels.asName(0), 'FATAL');
    });

    test('std threshold', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      // For increasing levels: level meets threshold if level >= threshold
      assertEquals(logLevels.meetsThreshold(4, 4), true);  // level 4 >= threshold 4
      assertEquals(logLevels.meetsThreshold(4, 5), false); // level 4 < threshold 5
      assertEquals(logLevels.meetsThreshold(5, 4), true);  // level 5 >= threshold 4
      assertEquals(logLevels.meetsThreshold(4, 2), true);  // level 4 >= threshold 2
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
      assertEquals(logLevels.applyColors('test', 'FATAL'), set.redText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'CRITICAL'), set.redText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'ERROR'), set.redText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'WARN'), set.yellowText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'INFO'), set.greenText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'VERBOSE'), set.cyanText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'DEBUG'), '\u001b[2m' + set.blueText + 'test' + reset.fg + '\u001b[22m');
      assertEquals(logLevels.applyColors('test', 'TRACE'), set.grayText + 'test' + reset.fg);
      assertEquals(logLevels.applyColors('test', 'SPAM'), '\u001b[2m' + set.grayText + 'test' + reset.fg + '\u001b[22m');
    });
  });

  describe('min', () => {
    test('values', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      assertEquals(logLevels.asValue('error'), 1);
      assertEquals(logLevels.asValue('warn'), 2);
      assertEquals(logLevels.asValue('info'), 3);
      assertEquals(logLevels.asValue('debug'), 5);
      assertEquals(logLevels.asName(5), 'DEBUG');
      assertEquals(logLevels.asName(3), 'INFO');
      assertEquals(logLevels.asName(2), 'WARN');
      assertEquals(logLevels.asName(1), 'ERROR');
    });

    test('std threshold', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      // For increasing levels: level meets threshold if level >= threshold
      assertEquals(logLevels.meetsThreshold(2, 2), true);  // level 2 >= threshold 2
      assertEquals(logLevels.meetsThreshold(2, 3), false); // level 2 < threshold 3
      assertEquals(logLevels.meetsThreshold(3, 2), true);  // level 3 >= threshold 2
      assertEquals(logLevels.meetsThreshold(2, 1), true);  // level 2 >= threshold 1
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
      assertEquals(logLevels.applyColors('test', 'DEBUG'), '\u001b[2m' + set.blueText + 'test' + reset.fg + '\u001b[22m');
    });
  });
});
