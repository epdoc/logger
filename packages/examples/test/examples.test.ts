/**
 * @file Functional tests for example scripts
 * @description Runs each example script as a subprocess and verifies it
 * completes successfully and produces expected stdout output.
 */

import { describe, it } from '@std/testing/bdd';
import { expect } from '@std/expect';

const EXAMPLES_DIR = new URL('..', import.meta.url).pathname;

/** Run an example script and return its stdout, stderr, and exit code. */
async function runExample(filename: string, args: string[] = []): Promise<{
  stdout: string;
  stderr: string;
  code: number;
}> {
  const cmd = new Deno.Command('deno', {
    args: ['run', '-A', '--no-lock', '--min-dep-age=0', filename, ...args],
    cwd: EXAMPLES_DIR,
    stdout: 'piped',
    stderr: 'piped',
  });
  const result = await cmd.output();
  return {
    stdout: new TextDecoder().decode(result.stdout),
    stderr: new TextDecoder().decode(result.stderr),
    code: result.code,
  };
}

describe('Example scripts', () => {
  it('logger.01 - default Std Logger setup', async () => {
    const { stdout, code } = await runExample('logger.01.run.ts');
    expect(code).toBe(0);
    expect(stdout).toContain('Example 01');
    expect(stdout).toContain('Transport:');
    expect(stdout).toContain('Threshold:');
    expect(stdout).toContain('Show:');
    expect(stdout).toContain('warning message');
    // debug and spam should NOT appear (threshold is info)
    expect(stdout).not.toContain("debug message won't show");
    expect(stdout).not.toContain("spam message won't show");
  });

  it('logger.02 - explicit Std Logger setup', async () => {
    const { stdout, code } = await runExample('logger.02.run.ts');
    expect(code).toBe(0);
    expect(stdout).toContain('Example 02');
    expect(stdout).toContain('Explicit setup');
    expect(stdout).toContain('Transport:');
    expect(stdout).toContain('Threshold:');
    expect(stdout).toContain('warning message');
    expect(stdout).not.toContain("debug message won't show");
  });

  it('logger.03 - show level and timestamp', async () => {
    const { stdout, code } = await runExample('logger.03.run.ts');
    expect(code).toBe(0);
    expect(stdout).toContain('Example 03');
    expect(stdout).toContain('Transports:');
    expect(stdout).toContain('Threshold:');
    expect(stdout).toContain('error message');
    expect(stdout).not.toContain("debug message won't show");
  });

  it('logger.04 - custom message builder', async () => {
    const { stdout, code } = await runExample('logger.04.run.ts', ['--no-color']);
    expect(code).toBe(0);
    expect(stdout).toContain('Example 04');
    expect(stdout).toContain('Transports:');
    expect(stdout).toContain('[API]');
    expect(stdout).toContain('GET');
    expect(stdout).toContain('/api/users');
    expect(stdout).toContain('Response Time');
    expect(stdout).toContain('245'); // hardcoded metric value in the example script, not actual elapsed time
    expect(stdout).toContain('error message');
    expect(stdout).toContain('debug message will show');
  });

  it('logger.05 - CLI Logger levels', async () => {
    const { stdout, code } = await runExample('logger.05.run.ts');
    expect(code).toBe(0);
    expect(stdout).toContain('Example 05');
    expect(stdout).toContain('Threshold:');
    expect(stdout).toContain('error message');
    expect(stdout).toContain('debug message');
    expect(stdout).toContain('prompt message');
    expect(stdout).toContain('input message');
    expect(stdout).toContain('silly message');
  });

  it('logger.06 - output options, child loggers, mark/ewt', async () => {
    const { stdout, code } = await runExample('logger.06.run.ts');
    expect(code).toBe(0);
    expect(stdout).toContain('Configuring more output options');
    expect(stdout).toContain('Threshold:');
    expect(stdout).toContain('Debug message is now visible');
    expect(stdout).toContain('Elapsed time');
    expect(stdout).toContain('Child Logger');
    expect(stdout).toContain('childPkg');
    expect(stdout).toContain('1234567890');
  });

  // Influx example requires env vars and external service; skip by default
  it('logger.influx - skipped (requires InfluxDB env vars)', () => {
    // This test documents that the influx example exists but is not run
    // in CI because it requires INFLUX_HOST, INFLUX_ADMIN_TOKEN, etc.
  });
});
