import { assertEquals } from '@std/assert';
import * as colors from '@std/fmt/colors';
import { describe, test } from '@std/testing/bdd';
import * as Level from '../src/mod.ts';
import { reset, set } from './color-map.ts';

const DEFS: Level.LogLevelsSet = {
  id: 'test1',
  levels: {
    error: { severity: 17, fmtFn: colors.red },
    warn: { severity: 13, fmtFn: colors.yellow },
    help: { severity: 15, fmtFn: colors.cyan },
    data: { severity: 11, fmtFn: colors.gray },
    info: { severity: 9, fmtFn: colors.green },
    debug: { severity: 5, fmtFn: colors.blue },
    prompt: { severity: 7, fmtFn: colors.gray },
    verbose: { severity: 3, fmtFn: colors.cyan },
    input: { severity: 2, fmtFn: colors.gray },
    silly: { severity: 1, fmtFn: colors.magenta },
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
    assertEquals(logLevels.asSpec('info')!.severity, 9);
    // Test that invalid severity throws
    try {
      logLevels.asName(4);
      throw new Error('Expected asName(4) to throw');
    } catch (e) {
      assertEquals((e as Error).message, 'Cannot get log level: no name for level: 4');
    }
    assertEquals(logLevels.asSpec(2)!.name, 'INPUT');
    assertEquals(logLevels.asSpec(3)!.name, 'VERBOSE');
    assertEquals(logLevels.asSpec(1)!.name, 'SILLY');
    assertEquals(logLevels.asSpec(11)!.name, 'DATA');
    assertEquals(logLevels.asSpec(15)!.name, 'HELP');
    assertEquals(logLevels.asSpec(13)!.name, 'WARN');
    assertEquals(logLevels.asSpec(17)!.name, 'ERROR');
  });

  test('width', () => {
    assertEquals(logLevels.maxWidth('INFO'), 5);
    assertEquals(logLevels.maxWidth('PROMPT'), 6);
    assertEquals(logLevels.maxWidth('SILLY'), 7);
  });
  test('marked levels', () => {
    assertEquals(logLevels.warnLevel!.name, 'WARN');
    assertEquals(logLevels.warnLevel!.severity, 13);
    assertEquals(logLevels.defaultLevel!.severity, 9);
    assertEquals(logLevels.defaultLevel!.name, 'INFO');
  });

  test('compare levels', () => {
    // Using Def objects
    const errorDef = logLevels.asSpec('error')!;
    const warnDef = logLevels.asSpec('warn')!;
    const infoDef = logLevels.asSpec('info')!;
    const debugDef = logLevels.asSpec('debug')!;

    assertEquals(logLevels.compareLevels(errorDef, errorDef), 0);
    assertEquals(logLevels.compareLevels(warnDef, errorDef), -1);
    assertEquals(logLevels.compareLevels(errorDef, warnDef), +1);
    assertEquals(logLevels.compareLevels(infoDef, debugDef), +1);
    assertEquals(logLevels.compareLevels(debugDef, infoDef), -1);
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
