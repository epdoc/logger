import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

describe('CliApp Examples System Tests', () => {
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

  it('example.01.test.ts: should show help', async () => {
    const { code, outStr } = await runExample('example.01.test.ts', ['--help']);
    expect(code).toBe(0);
    expect(outStr).toContain('Usage:');
  });

  it('example.01.test.ts: should process files', async () => {
    const { code, outStr } = await runExample('example.01.test.ts', [
      'process',
      'file1',
      'file2',
    ]);
    expect(code).toBe(0);
    expect(outStr).toContain('Processing:');
    expect(outStr).toContain('Files: 2 file');
  });

  it('example.02.test.ts: should process files with pattern', async () => {
    const { code, outStr } = await runExample('example.02.test.ts', [
      'process',
      'file1',
      'file2',
    ]);
    expect(code).toBe(0);
    expect(outStr).toContain('File Processing');
    expect(outStr).toContain('Processed 2 files successfully');
  });

  it('example.03.test.ts: should run declarative command', async () => {
    const { code, outStr } = await runExample('example.03.test.ts', [
      'process',
      'file1',
    ]);
    expect(code).toBe(0);
    expect(outStr).toContain('Processing:');
    expect(outStr).toContain('Files: 1 file');
  });

  it('example.04.test.ts: should use custom message builder', async () => {
    const { code, outStr } = await runExample('example.04.test.ts', [
      'process',
      'file1',
    ]);
    expect(code).toBe(0);
    expect(outStr).toContain('PROCESS');
    expect(outStr).toContain('Progress: 1/1');
  });

  it('any example: should respect --no-color (no escape codes)', async () => {
    const { code, outStr } = await runExample('example.01.test.ts', [
      'process',
      'file1',
    ]);
    expect(code).toBe(0);
    // Check for ANSI escape sequences
    // deno-lint-ignore no-control-regex
    const hasColor = /\x1b\[\d+m/.test(outStr);
    expect(hasColor).toBe(false);
  });
});
