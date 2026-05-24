import * as assert from 'node:assert';

Deno.test('CliApp Examples System Tests', async (t) => {
  const runExample = async (script: string, args: string[] = []) => {
    const scriptPath = new URL(`./${script}`, import.meta.url).pathname;
    const cmd = new Deno.Command(Deno.execPath(), {
      args: ['run', '-A', scriptPath, '--no-color', ...args],
      stdout: 'piped',
      stderr: 'piped',
    });
    const { code, stdout, stderr } = await cmd.output();
    const outStr = new TextDecoder().decode(stdout);
    const errStr = new TextDecoder().decode(stderr);
    return { code, outStr, errStr };
  };

  await t.step('example.01.test.ts: should show help', async () => {
    const { code, outStr } = await runExample('example.01.test.ts', ['--help']);
    assert.strictEqual(code, 0);
    assert.ok(outStr.includes('Usage:'));
  });

  await t.step('example.01.test.ts: should process files', async () => {
    const { code, outStr } = await runExample('example.01.test.ts', [
      'process',
      'file1',
      'file2',
    ]);
    assert.strictEqual(code, 0);
    assert.ok(outStr.includes('Processing:'));
    assert.ok(outStr.includes('Files: 2 file'));
  });

  await t.step('example.02.test.ts: should process files with pattern', async () => {
    const { code, outStr } = await runExample('example.02.test.ts', [
      'process',
      'file1',
      'file2',
    ]);
    assert.strictEqual(code, 0);
    assert.ok(outStr.includes('File Processing'));
    assert.ok(outStr.includes('Processed 2 files successfully'));
  });

  await t.step('example.03.test.ts: should run declarative command', async () => {
    const { code, outStr } = await runExample('example.03.test.ts', [
      'process',
      'file1',
    ]);
    assert.strictEqual(code, 0);
    assert.ok(outStr.includes('Processing:'));
    assert.ok(outStr.includes('Files: 1 file'));
  });

  await t.step('example.04.test.ts: should use custom message builder', async () => {
    const { code, outStr } = await runExample('example.04.test.ts', [
      'process',
      'file1',
    ]);
    assert.strictEqual(code, 0);
    assert.ok(outStr.includes('PROCESS'));
    assert.ok(outStr.includes('Progress: 1/1'));
  });

  await t.step('any example: should respect --no-color (no escape codes)', async () => {
    const { code, outStr } = await runExample('example.01.test.ts', [
      'process',
      'file1',
    ]);
    assert.strictEqual(code, 0);
    console.log(outStr);
    // Check for ANSI escape sequences
    // deno-lint-ignore no-control-regex
    const hasColor = /\x1b\[\d+m/.test(outStr);
    assert.strictEqual(hasColor, false);
  });
});
