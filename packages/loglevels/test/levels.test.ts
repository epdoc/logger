import * as colors from '@std/fmt/colors';
import * as assert from 'node:assert';
import * as Level from '../src/mod.ts';
import { applyColors, compareLevels } from '../src/utils.ts';
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

const colorResult: string[] = [
  'hello',
  set.magentaText + 'hello' + reset.fg,
  set.grayText + 'hello' + reset.fg,
  set.cyanText + 'hello' + reset.fg,
  'hello',
  set.blueText + 'hello' + reset.fg,
  'hello',
  set.grayText + 'hello' + reset.fg,
  'hello',
  set.greenText + 'hello' + reset.fg,
  'hello',
  set.grayText + 'hello' + reset.fg,
  'hello',
  set.yellowText + 'hello' + reset.fg,
  'hello',
  set.cyanText + 'hello' + reset.fg,
  'hello',
  set.redText + 'hello' + reset.fg,
  'hello',
  'hello',
  'hello',
  'hello',
  'hello',
  'hello',
  'hello',
];

Deno.test('levels cli', async (t) => {
  const logLevels = new Level.LogLevels(DEFS);

  await t.step('specMap keys and values', () => {
    assert.deepStrictEqual(Array.from(logLevels.specMap.keys()), [
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
    assert.strictEqual(logLevels.$$id, 'test1');
    assert.strictEqual(logLevels.asSpec('info')!.severity, 9);
    assert.strictEqual(logLevels.asSpec(4), undefined);
    assert.strictEqual(logLevels.asSpec(2)!.name, 'INPUT');
    assert.strictEqual(logLevels.asSpec(3)!.name, 'VERBOSE');
    assert.strictEqual(logLevels.asSpec(1)!.name, 'SILLY');
    assert.strictEqual(logLevels.asSpec(11)!.name, 'DATA');
    assert.strictEqual(logLevels.asSpec(15)!.name, 'HELP');
    assert.strictEqual(logLevels.asSpec(13)!.name, 'WARN');
    assert.strictEqual(logLevels.asSpec(17)!.name, 'ERROR');
  });

  await t.step('width', () => {
    assert.strictEqual(logLevels.maxWidth(logLevels.asSpec('INFO')!), 5);
    assert.strictEqual(logLevels.maxWidth(logLevels.asSpec('PROMPT')!), 6);
    assert.strictEqual(logLevels.maxWidth(logLevels.asSpec('SILLY')!), 7);
  });

  await t.step('marked levels', () => {
    assert.strictEqual(logLevels.warnLevel!.name, 'WARN');
    assert.strictEqual(logLevels.warnLevel!.severity, 13);
    assert.strictEqual(logLevels.defaultLevel!.severity, 9);
    assert.strictEqual(logLevels.defaultLevel!.name, 'INFO');
  });

  await t.step('compare levels', () => {
    // Using Def objects
    const errorDef = logLevels.asSpec('error')!;
    const warnDef = logLevels.asSpec('warn')!;
    const infoDef = logLevels.asSpec('info')!;
    const debugDef = logLevels.asSpec('debug')!;

    assert.strictEqual(compareLevels(errorDef, errorDef), 0);
    assert.strictEqual(compareLevels(warnDef, errorDef), -1);
    assert.strictEqual(compareLevels(errorDef, warnDef), +1);
    assert.strictEqual(compareLevels(infoDef, debugDef), +1);
    assert.strictEqual(compareLevels(debugDef, infoDef), -1);
  });

  await t.step('color', () => {
    for (let severity = 1; severity <= 24; ++severity) {
      const spec: Level.Spec | null = logLevels.specArray[severity];
      const s: string = applyColors('hello', spec);
      assert.strictEqual(s, colorResult[severity]);
    }
  });
});
