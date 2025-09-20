/**
 * Unit tests for the log level management system.
 *
 * @remarks
 * This file contains tests for both the CLI-specific and standard log level
 * implementations, ensuring that level conversions, threshold checks, flush
 * behavior, and color application functions as expected.
 *
 * @module
 */
import { assertEquals } from '@std/assert';
import { describe, test } from '@std/testing/bdd';
import * as Log from '../mod.ts';

describe('levels', () => {
  describe('cli', () => {
    test('values', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assertEquals(logLevels.names, [
        'ERROR',
        'WARN',
        'HELP',
        'DATA',
        'INFO',
        'DEBUG',
        'PROMPT',
        'VERBOSE',
        'INPUT',
        'SILLY',
      ]);
      assertEquals(logLevels.asValue('info'), 4);
      assertEquals(logLevels.asName(4), 'INFO');
      assertEquals(logLevels.asName(5), 'DEBUG');
      assertEquals(logLevels.asName(6), 'PROMPT');
      assertEquals(logLevels.asName(7), 'VERBOSE');
      assertEquals(logLevels.asName(8), 'INPUT');
      assertEquals(logLevels.asName(9), 'SILLY');
      assertEquals(logLevels.asName(3), 'DATA');
      assertEquals(logLevels.asName(2), 'HELP');
      assertEquals(logLevels.asName(1), 'WARN');
      assertEquals(logLevels.asName(0), 'ERROR');
    });

    test('cli threshold', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assertEquals(logLevels.meetsThreshold(4, 4), true);
      assertEquals(logLevels.meetsThreshold(4, 5), true);
      assertEquals(logLevels.meetsThreshold(5, 4), false);
      assertEquals(logLevels.meetsThreshold(4, 2), false);
    });

    test('cli flush threshold', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assertEquals(logLevels.meetsFlushThreshold('INFO'), false);
      assertEquals(logLevels.meetsFlushThreshold('DEBUG'), false);
      assertEquals(logLevels.meetsFlushThreshold('PROMPT'), false);
      assertEquals(logLevels.meetsFlushThreshold('VERBOSE'), false);
      assertEquals(logLevels.meetsFlushThreshold('INPUT'), false);
      assertEquals(logLevels.meetsFlushThreshold('SILLY'), false);
      assertEquals(logLevels.meetsFlushThreshold('ERROR'), true);
      assertEquals(logLevels.meetsFlushThreshold('WARN'), false);
      assertEquals(logLevels.meetsFlushThreshold('HELP'), false);
      assertEquals(logLevels.meetsFlushThreshold('DATA'), false);
      assertEquals(logLevels.meetsFlushThreshold(3), false);
      assertEquals(logLevels.meetsFlushThreshold(0), true);
    });

    test('cli applyColors', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assertEquals(logLevels.applyColors('hello', 'INFO'), '\u001b[32mhello\u001b[39m');
    });
  });
  describe('std', () => {
    test('values', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      assertEquals(logLevels.names, [
        'FATAL',
        'CRITICAL',
        'ERROR',
        'WARN',
        'INFO',
        'VERBOSE',
        'DEBUG',
        'TRACE',
        'SPAM',
        'SILLY',
      ]);
      assertEquals(logLevels.asValue('info'), 3);
      assertEquals(logLevels.asName(3), 'INFO');
      assertEquals(logLevels.asName(5), 'DEBUG');
      assertEquals(logLevels.asName(4), 'VERBOSE');
      assertEquals(logLevels.asName(7), 'SPAM');
      assertEquals(logLevels.asName(6), 'TRACE');
      assertEquals(logLevels.asName(2), 'WARN');
      assertEquals(logLevels.asName(1), 'ERROR');
      assertEquals(logLevels.asName(0), 'FATAL');
    });

    test('std threshold', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      assertEquals(logLevels.meetsThreshold(4, 4), true);
      assertEquals(logLevels.meetsThreshold(4, 5), true);
      assertEquals(logLevels.meetsThreshold(5, 4), false);
      assertEquals(logLevels.meetsThreshold(4, 2), false);
    });

    test('std flush threshold', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      assertEquals(logLevels.meetsFlushThreshold('INFO'), false);
      assertEquals(logLevels.meetsFlushThreshold('DEBUG'), false);
      assertEquals(logLevels.meetsFlushThreshold('TRACE'), false);
      assertEquals(logLevels.meetsFlushThreshold('VERBOSE'), false);
      assertEquals(logLevels.meetsFlushThreshold('ERROR'), true);
      assertEquals(logLevels.meetsFlushThreshold('WARN'), false);
      assertEquals(logLevels.meetsFlushThreshold('SPAM'), false);
      assertEquals(logLevels.meetsFlushThreshold(3), false);
      assertEquals(logLevels.meetsFlushThreshold(0), true);
    });

    test('std applyColors', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assertEquals(logLevels.applyColors('hello', 'INFO'), '\u001b[32mhello\u001b[39m');
    });
  });
  describe('min', () => {
    test('values', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      assertEquals(logLevels.names, [
        'ERROR',
        'WARN',
        'INFO',
        'DEBUG',
      ]);
      assertEquals(logLevels.asValue('info'), 3);
      assertEquals(logLevels.asName(3), 'INFO');
      assertEquals(logLevels.asName(5), 'DEBUG');
      assertEquals(logLevels.asName(2), 'WARN');
      assertEquals(logLevels.asName(1), 'ERROR');
    });

    test('std threshold', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      assertEquals(logLevels.meetsThreshold(3, 3), true);
      assertEquals(logLevels.meetsThreshold(3, 5), true);
      assertEquals(logLevels.meetsThreshold(5, 3), false);
      assertEquals(logLevels.meetsThreshold(3, 2), false);
    });

    test('std flush threshold', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      assertEquals(logLevels.meetsFlushThreshold('INFO'), false);
      assertEquals(logLevels.meetsFlushThreshold('DEBUG'), false);
      assertEquals(logLevels.meetsFlushThreshold('ERROR'), true);
      assertEquals(logLevels.meetsFlushThreshold('WARN'), false);
      assertEquals(logLevels.meetsFlushThreshold(3), false);
      assertEquals(logLevels.meetsFlushThreshold(1), true);
    });

    test('std applyColors', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assertEquals(logLevels.applyColors('hello', 'INFO'), '\u001b[32mhello\u001b[39m');
    });
  });
});
