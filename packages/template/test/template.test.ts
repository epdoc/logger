import { assertEquals, assertStringIncludes } from '@std/assert';

Deno.test('template command without --sub flag', async () => {
  const command = new Deno.Command('deno', {
    args: ['run', '-A', 'main.ts', '--help'],
    cwd: new URL('..', import.meta.url).pathname,
    stdout: 'piped',
    stderr: 'piped',
  });

  const { code, stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(code, 0, 'Command should exit successfully');
  assertStringIncludes(output, 'template', 'Should show template command name');
  assertStringIncludes(output, '--details', 'Should show --details option');
});

Deno.test('template command with --sub flag', async () => {
  const command = new Deno.Command('deno', {
    args: ['run', '-A', 'main.ts', '--sub', '--help'],
    cwd: new URL('..', import.meta.url).pathname,
    stdout: 'piped',
    stderr: 'piped',
  });

  const { code, stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(code, 0, 'Command should exit successfully');
  assertStringIncludes(output, 'template', 'Should show template command name');
});

Deno.test('template command with files argument', async () => {
  const command = new Deno.Command('deno', {
    args: ['run', '-A', 'main.ts', 'file1.txt', 'file2.txt'],
    cwd: new URL('..', import.meta.url).pathname,
    stdout: 'piped',
    stderr: 'piped',
  });

  const { code, stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(code, 0, 'Command should exit successfully');
  assertStringIncludes(output, 'TemplateTool', 'Should run TemplateTool');
  assertStringIncludes(output, 'File', 'Should process files');
});
