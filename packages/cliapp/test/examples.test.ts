import { expect } from '@std/expect';
import { describe, it } from '@std/testing/bdd';

describe('CliApp Examples System Tests', () => {
  const examplesDir = new URL('../../examples/', import.meta.url).pathname;

  const runExample = async (script: string, args: string[] = []) => {
    const cmd = new Deno.Command(Deno.execPath(), {
      args: ['run', '-A', `${examplesDir}${script}`, '--no-color', ...args],
      stdout: 'piped',
      stderr: 'piped',
    });
    const { code, stdout, stderr } = await cmd.output();
    const outStr = new TextDecoder().decode(stdout);
    const errStr = new TextDecoder().decode(stderr);
    return { code, outStr, errStr };
  };

  it('cliapp.01.run.ts: should show help', async () => {
    const { code, outStr } = await runExample('cliapp.01.run.ts', ['--help']);
    expect(code).toBe(0);
    expect(outStr).toContain('Usage:');
  });

  it('cliapp.01.run.ts: should process files', async () => {
    const { code, outStr } = await runExample('cliapp.01.run.ts', ['process', 'file1', 'file2']);
    expect(code).toBe(0);
    expect(outStr).toContain('Processing:');
    expect(outStr).toContain('Files: 2 file');
  });

  it('cliapp.02.run.ts: should process files with pattern', async () => {
    const { code, outStr } = await runExample('cliapp.02.run.ts', ['process', 'file1', 'file2']);
    expect(code).toBe(0);
    expect(outStr).toContain('File Processing');
    expect(outStr).toContain('Processed 2 files successfully');
  });

  it('cliapp.03.run.ts: should run declarative command', async () => {
    const { code, outStr } = await runExample('cliapp.03.run.ts', ['process', 'file1']);
    expect(code).toBe(0);
    expect(outStr).toContain('Processing:');
    expect(outStr).toContain('Files: 1 file');
  });

  it('custom.msgbuilder.run.ts: should use custom message builder', async () => {
    const { code, outStr } = await runExample('custom.msgbuilder.run.ts', ['process', 'file1']);
    expect(code).toBe(0);
    expect(outStr).toContain('PROCESS');
    expect(outStr).toContain('Progress: 1/1');
  });

  it('any example: should respect --no-color (no escape codes)', async () => {
    const { code, outStr } = await runExample('cliapp.01.run.ts', ['process', 'file1']);
    expect(code).toBe(0);
    // Check for ANSI escape sequences
    // deno-lint-ignore no-control-regex
    const hasColor = /\x1b\[\d+m/.test(outStr);
    expect(hasColor).toBe(false);
  });
});
