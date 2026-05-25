import { applyColors } from '@epdoc/loglevels';
import * as assert from 'node:assert';
import { reset, set } from '../../../test-utils/color-map.ts';
import * as Log from '../src/mod.ts';

Deno.test('levels', async (t) => {
  await t.step('cli', async (t) => {
    await t.step('values', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assert.strictEqual(logLevels.asSpec('error')!.severity, 17);
      assert.strictEqual(logLevels.asSpec('warn')!.severity, 13);
      assert.strictEqual(logLevels.asSpec('help')!.severity, 11);
      assert.strictEqual(logLevels.asSpec('data')!.severity, 10);
      assert.strictEqual(logLevels.asSpec('info')!.severity, 9);
      assert.strictEqual(logLevels.asSpec('debug')!.severity, 5);
      assert.strictEqual(logLevels.asSpec('prompt')!.severity, 4);
      assert.strictEqual(logLevels.asSpec('verbose')!.severity, 3);
      assert.strictEqual(logLevels.asSpec('input')!.severity, 2);
      assert.strictEqual(logLevels.asSpec('silly')!.severity, 1);
      assert.strictEqual(logLevels.asSpec(1)!.name, 'SILLY');
      assert.strictEqual(logLevels.asSpec(2)!.name, 'INPUT');
      assert.strictEqual(logLevels.asSpec(3)!.name, 'VERBOSE');
      assert.strictEqual(logLevels.asSpec(4)!.name, 'PROMPT');
      assert.strictEqual(logLevels.asSpec(5)!.name, 'DEBUG');
      assert.strictEqual(logLevels.asSpec(9)!.name, 'INFO');
      assert.strictEqual(logLevels.asSpec(10)!.name, 'DATA');
      assert.strictEqual(logLevels.asSpec(11)!.name, 'HELP');
      assert.strictEqual(logLevels.asSpec(13)!.name, 'WARN');
      assert.strictEqual(logLevels.asSpec(17)!.name, 'ERROR');
    });

    await t.step('cli threshold', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      // For increasing levels: level meets threshold if level >= threshold
      assert.strictEqual(logLevels.asSpec('prompt')!.severity >= logLevels.asSpec('prompt')!.severity, true);
      assert.strictEqual(logLevels.asSpec('prompt')!.severity >= logLevels.asSpec('verbose')!.severity, true);
      assert.strictEqual(logLevels.asSpec('verbose')!.severity >= logLevels.asSpec('prompt')!.severity, false);
      assert.strictEqual(logLevels.asSpec(3)!.severity >= logLevels.asSpec(4)!.severity, false);
      assert.strictEqual(logLevels.asSpec('prompt')!.severity >= logLevels.asSpec('silly')!.severity, true);
    });

    await t.step('cli flush threshold', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assert.strictEqual(logLevels.asSpec('error')!.severity >= logLevels.flushLevel.severity, true);
      assert.strictEqual(logLevels.asSpec('warn')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('help')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('data')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('info')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('debug')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('prompt')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('verbose')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('input')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('silly')!.severity >= logLevels.flushLevel.severity, false);
    });

    await t.step('cli applyColors', () => {
      const logLevels = Log.Cli.factoryMethods.createLevels();
      assert.strictEqual(applyColors('test', logLevels.asSpec('ERROR')!), set.redText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('WARN')!), set.yellowText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('HELP')!), set.cyanText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('DATA')!), set.grayText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('INFO')!), set.greenText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('DEBUG')!), set.blueText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('PROMPT')!), set.grayText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('VERBOSE')!), set.cyanText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('INPUT')!), set.grayText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('SILLY')!), set.magentaText + 'test' + reset.fg);
    });
  });

  await t.step('std', async (t) => {
    await t.step('values', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      assert.strictEqual(logLevels.asSpec('fatal')!.severity, 22);
      assert.strictEqual(logLevels.asSpec('critical')!.severity, 21);
      assert.strictEqual(logLevels.asSpec('error')!.severity, 17);
      assert.strictEqual(logLevels.asSpec('warn')!.severity, 13);
      assert.strictEqual(logLevels.asSpec('info')!.severity, 9);
      assert.strictEqual(logLevels.asSpec('verbose')!.severity, 6);
      assert.strictEqual(logLevels.asSpec('debug')!.severity, 5);
      assert.strictEqual(logLevels.asSpec('trace')!.severity, 4);
      assert.strictEqual(logLevels.asSpec('spam')!.severity, 2);
      assert.strictEqual(logLevels.asSpec(2)!.name, 'SPAM');
      assert.strictEqual(logLevels.asSpec(4)!.name, 'TRACE');
      assert.strictEqual(logLevels.asSpec(5)!.name, 'DEBUG');
      assert.strictEqual(logLevels.asSpec(6)!.name, 'VERBOSE');
      assert.strictEqual(logLevels.asSpec(9)!.name, 'INFO');
      assert.strictEqual(logLevels.asSpec(13)!.name, 'WARN');
      assert.strictEqual(logLevels.asSpec(17)!.name, 'ERROR');
      assert.strictEqual(logLevels.asSpec(22)!.name, 'FATAL');
    });

    await t.step('std threshold', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      // For increasing levels: level meets threshold if level >= threshold
      assert.strictEqual(logLevels.asSpec(4)!.severity >= 3, true);
      assert.strictEqual(logLevels.asSpec(4)!.severity >= 4, true);
      assert.strictEqual(logLevels.asSpec(5)!.severity > 4, true);
      assert.strictEqual(logLevels.asSpec(4)!.severity > 4, false);
    });

    await t.step('std flush threshold', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      assert.strictEqual(logLevels.asSpec('fatal')!.severity >= logLevels.flushLevel.severity, true);
      assert.strictEqual(logLevels.asSpec('critical')!.severity >= logLevels.flushLevel.severity, true);
      assert.strictEqual(logLevels.asSpec('error')!.severity >= logLevels.flushLevel.severity, true);
      assert.strictEqual(logLevels.asSpec('warn')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('info')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('verbose')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('debug')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('trace')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('spam')!.severity >= logLevels.flushLevel.severity, false);
    });

    await t.step('std applyColors', () => {
      const logLevels = Log.Std.factoryMethods.createLevels();
      assert.strictEqual(applyColors('test', logLevels.asSpec('FATAL')), set.brightRedText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('CRITICAL')), set.brightRedText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('ERROR')), set.redText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('WARN')), set.yellowText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('INFO')), set.greenText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('VERBOSE')), set.cyanText + 'test' + reset.fg);
      assert.strictEqual(
        applyColors('test', logLevels.asSpec('DEBUG')),
        '\u001b[2m' + set.blueText + 'test' + reset.fg + '\u001b[22m',
      );
      assert.strictEqual(applyColors('test', logLevels.asSpec('TRACE')), set.grayText + 'test' + reset.fg);
      assert.strictEqual(
        applyColors('test', logLevels.asSpec('SPAM')),
        '\u001b[2m' + set.grayText + 'test' + reset.fg + '\u001b[22m',
      );
    });
  });

  await t.step('min', async (t) => {
    await t.step('values', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      // deno-lint-ignore no-explicit-any
      const errorSpec: any = logLevels.asSpec('error')!;
      assert.ok(errorSpec.severity === 17 && errorSpec.name === 'ERROR');
      // deno-lint-ignore no-explicit-any
      const warnSpec: any = logLevels.asSpec('warn')!;
      assert.ok(warnSpec.severity === 13 && warnSpec.name === 'WARN');
      // deno-lint-ignore no-explicit-any
      const infoSpec: any = logLevels.asSpec('info')!;
      assert.ok(infoSpec.severity === 9 && infoSpec.name === 'INFO');
      // deno-lint-ignore no-explicit-any
      const debugSpec: any = logLevels.asSpec('debug')!;
      assert.ok(debugSpec.severity === 5 && debugSpec.name === 'DEBUG');
      // deno-lint-ignore no-explicit-any
      const spec5: any = logLevels.asSpec(5)!;
      assert.ok(spec5.name === 'DEBUG' && spec5.severity === 5);
      // deno-lint-ignore no-explicit-any
      const spec9: any = logLevels.asSpec(9)!;
      assert.ok(spec9.name === 'INFO' && spec9.severity === 9);
      // deno-lint-ignore no-explicit-any
      const spec13: any = logLevels.asSpec(13)!;
      assert.ok(spec13.name === 'WARN' && spec13.severity === 13);
      // deno-lint-ignore no-explicit-any
      const spec17: any = logLevels.asSpec(17)!;
      assert.ok(spec17.name === 'ERROR' && spec17.severity === 17);
    });

    await t.step('std threshold', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      // For increasing levels: level meets threshold if level >= threshold
      assert.strictEqual(logLevels.asSpec(17)!.severity >= 13, true);
      assert.strictEqual(logLevels.asSpec(13)!.severity >= 13, true);
      assert.strictEqual(logLevels.asSpec(5)!.severity >= 9, false);
      assert.strictEqual(logLevels.asSpec(5)!.severity >= 13, false);
      assert.strictEqual(logLevels.asSpec('wild'), undefined);
    });

    await t.step('std flush threshold', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      assert.strictEqual(logLevels.asSpec('error')!.severity >= logLevels.flushLevel.severity, true);
      assert.strictEqual(logLevels.asSpec('warn')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('info')!.severity >= logLevels.flushLevel.severity, false);
      assert.strictEqual(logLevels.asSpec('debug')!.severity >= logLevels.flushLevel.severity, false);
    });

    await t.step('std applyColors', () => {
      const logLevels = Log.Min.factoryMethods.createLevels();
      assert.strictEqual(applyColors('test', logLevels.asSpec('ERROR')), set.redText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('WARN')), set.yellowText + 'test' + reset.fg);
      assert.strictEqual(applyColors('test', logLevels.asSpec('INFO')), set.greenText + 'test' + reset.fg);
      assert.strictEqual(
        applyColors('test', logLevels.asSpec('DEBUG')!),
        '\u001b[2m' + set.blueText + 'test' + reset.fg + '\u001b[22m',
      );
    });
  });
});
