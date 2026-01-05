import { assertEquals, assertThrows } from '@std/assert';
import * as colors from '@std/fmt/colors';
import { describe, test } from '@std/testing/bdd';
import * as Level from '../src/mod.ts';
import { reset, set } from './color-map.ts';

const DEFS: Level.LogLevelsSet = {
  id: 'test1',
  levels: {
    error: { val: 0, fmtFn: colors.red, flush: true },
    warn: { val: 1, fmtFn: colors.yellow, warn: true },
    help: { val: 2, fmtFn: colors.cyan },
    data: { val: 3, fmtFn: colors.gray },
    info: { val: 4, fmtFn: colors.green, default: true },
    debug: { val: 5, fmtFn: colors.blue },
    prompt: { val: 6, fmtFn: colors.gray },
    verbose: { val: 7, fmtFn: colors.cyan },
    input: { val: 8, fmtFn: colors.gray },
    silly: { val: 9, fmtFn: colors.magenta, lowest: true },
  },
} as const;

describe('levels cli', () => {
  const logLevels = new Level.LogLevels(DEFS);

  test('names and values', () => {
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
    assertEquals(logLevels.$$id, 'test1');
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

  test('width', () => {
    assertEquals(logLevels.maxWidth('INFO'), 5);
    assertEquals(logLevels.maxWidth('PROMPT'), 6);
    assertEquals(logLevels.maxWidth('SILLY'), 7);
  });
  test('marked levels', () => {
    assertEquals(logLevels.warnLevelName, 'WARN');
    assertEquals(logLevels.lowestLevelName, 'SILLY');
    assertEquals(logLevels.defaultLevelName, 'INFO');
  });

  test('threshold', () => {
    assertEquals(logLevels.meetsThreshold(4, 4), true);
    assertEquals(logLevels.meetsThreshold(4, 5), true);
    assertEquals(logLevels.meetsThreshold(5, 4), false);
    assertEquals(logLevels.meetsThreshold(4, 2), false);
  });

  test('flush threshold', () => {
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

  test('color', () => {
    assertEquals(logLevels.applyColors('hello', 'ERROR'), set.redText + 'hello' + reset.fg);
    assertEquals(logLevels.applyColors('hello', 'WARN'), set.yellowText + 'hello' + reset.fg);
    assertEquals(logLevels.applyColors('hello', 'HELP'), set.cyanText + 'hello' + reset.fg);
    assertEquals(logLevels.applyColors('hello', 'DATA'), set.grayText + 'hello' + reset.fg);
    assertEquals(logLevels.applyColors('hello', 'INFO'), set.greenText + 'hello' + reset.fg);
    assertEquals(logLevels.applyColors('hello', 'DEBUG'), set.blueText + 'hello' + reset.fg);
    assertEquals(logLevels.applyColors('hello', 'PROMPT'), set.grayText + 'hello' + reset.fg);
    assertEquals(logLevels.applyColors('hello', 'VERBOSE'), set.cyanText + 'hello' + reset.fg);
    assertEquals(logLevels.applyColors('hello', 'INPUT'), set.grayText + 'hello' + reset.fg);
    assertEquals(logLevels.applyColors('hello', 'SILLY'), set.magentaText + 'hello' + reset.fg);
  });
});

const SEVERITY_DEFS: Level.LogLevelsSet = {
  id: 'test',
  levels: {
    emergency: { val: 0, severityNumber: 1, fmtFn: colors.red, flush: true },
    alert: { val: 1, severityNumber: 2, fmtFn: colors.red, flush: true },
    critical: { val: 2, severityNumber: 3, fmtFn: colors.red, flush: true },
    error: { val: 3, severityNumber: 4, fmtFn: colors.red, flush: true },
    warn: { val: 4, severityNumber: 5, fmtFn: colors.yellow, warn: true },
    notice: { val: 5, severityNumber: 6, fmtFn: colors.green },
    info: { val: 6, severityNumber: 7, fmtFn: colors.green, default: true },
    debug: { val: 7, severityNumber: 8, fmtFn: colors.blue },
    trace: { val: 8, severityNumber: 9, fmtFn: colors.cyan, lowest: true },
  },
} as const;

describe('levels with severityNumber (current behavior)', () => {
  const logLevels = new Level.LogLevels(SEVERITY_DEFS, true);

  test('names and values ignore severityNumber', () => {
    // Test that `asValue` and `asName` operate on `val`, not `severityNumber`
    assertEquals(logLevels.asValue('emergency'), 0);
    assertEquals(logLevels.asName(0), 'EMERGENCY');
    assertEquals(logLevels.asSeverityNumber('emergency'), 1);
    assertEquals(logLevels.asSeverityNumber(0), 1);

    assertEquals(logLevels.asValue('info'), 6);
    assertEquals(logLevels.asName(6), 'INFO');
    assertEquals(logLevels.asSeverityNumber('info'), 7);
    assertEquals(logLevels.asSeverityNumber(6), 7);

    assertEquals(logLevels.asValue('trace'), 8);
    assertEquals(logLevels.asName(8), 'TRACE');
    assertEquals(logLevels.asSeverityNumber('trace'), 9);
    assertEquals(logLevels.asSeverityNumber(8), 9);

    // Test that lookups for `severityNumber` values fail or return incorrect results
    // asName(1) should not return 'EMERGENCY' because it looks for `val`
    assertEquals(logLevels.asName(1), 'ALERT');
    // asName for a severityNumber that doesn't match any `val` should fail
    assertThrows(
      () => logLevels.asName(9),
      Error,
      'Cannot get log level: no name for level: 9',
    );
    assertThrows(
      () => logLevels.asSeverityNumber('fatal'),
      Error,
      'Cannot get log level: no name for level: fatal',
    );
  });

  test('thresholds ignore severityNumber', () => {
    // Threshold checks should be based on `val`
    assertEquals(logLevels.meetsThreshold('info', 'info'), true); // 6 vs 6
    assertEquals(logLevels.meetsThreshold('info', 'debug'), true); // 6 vs 7 (assuming increasing)
    assertEquals(logLevels.meetsThreshold('debug', 'info'), false); // 7 vs 6

    // A threshold check that would pass with severityNumber but fails with val
    // 'warn' (val: 4) vs 'notice' (val: 5)
    assertEquals(logLevels.meetsThreshold('warn', 'notice'), true);
  });
});

describe('levels with requireSeverityNumber: true (assumed behavior)', () => {
  const logLevels = new Level.LogLevels(SEVERITY_DEFS, true);

  test('constructor throws if severityNumber is missing', () => {
    const incompleteDefs: Level.LogLevelsSet = {
      id: 'test2',
      levels: {
        ...SEVERITY_DEFS.levels,
        fatal: { val: 9, fmtFn: colors.red }, // Missing severityNumber
      },
    };
    assertThrows(
      () => new Level.LogLevels(incompleteDefs, true),
      Error,
      'Invalid LogLevelsSet definition',
    );
  });

  test('asValue and asName do not use severityNumber', () => {
    assertEquals(logLevels.asValue('emergency'), 0);
    assertEquals(logLevels.asName(0), 'EMERGENCY');

    assertEquals(logLevels.asValue('info'), 6);
    assertEquals(logLevels.asName(6), 'INFO');

    assertEquals(logLevels.asValue('trace'), 8);
    assertEquals(logLevels.asName(8), 'TRACE');

    // Test lookup by val fails or is incorrect
    assertThrows(
      () => {
        logLevels.asName(9);
      },
      Error,
      'Cannot get log level: no name for level: 9',
    );
  });

  test('thresholds do not use severityNumber', () => {
    assertEquals(logLevels.meetsThreshold('info', 'info'), true); // 7 vs 7
    assertEquals(logLevels.meetsThreshold('info', 'debug'), true); // 7 vs 8
    assertEquals(logLevels.meetsThreshold('debug', 'info'), false); // 8 vs 7
  });
});
