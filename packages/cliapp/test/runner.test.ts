import { assertEquals, assertRejects, assertStrictEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { CommandError, runCommand, runCommandOrThrow } from '../src/runner.ts';

describe('runner', () => {
  describe('runCommand', () => {
    it('should run a command and return success for exit code 0', async () => {
      const result = await runCommand('deno', ['--version']);

      assertStrictEquals(result.success, true);
      assertStrictEquals(result.code, 0);
      assertEquals(result.stdout.includes('deno'), true);
      assertStrictEquals(result.stderr, '');
    });

    it('should return failure for non-zero exit code', async () => {
      const result = await runCommand('deno', ['eval', 'Deno.exit(1)']);

      assertStrictEquals(result.success, false);
      assertStrictEquals(result.code, 1);
    });

    it('should capture stderr on failure', async () => {
      // deno eval with syntax error produces stderr
      const result = await runCommand('deno', ['eval', 'invalid syntax here!!!']);

      assertStrictEquals(result.success, false);
      assertEquals(result.stderr.length > 0, true);
    });

    it('should run command in specified working directory', async () => {
      const result = await runCommand('pwd', [], { cwd: '/tmp' });

      assertStrictEquals(result.success, true);
      // On macOS /tmp is a symlink to /private/tmp, so we check the path ends with /tmp
      assertEquals(result.stdout.trim().endsWith('/tmp'), true);
    });

    it('should pass environment variables', async () => {
      const result = await runCommand('deno', [
        'eval',
        'console.log(Deno.env.get("TEST_VAR"))',
      ], {
        env: { TEST_VAR: 'hello_world' },
      });

      assertStrictEquals(result.success, true);
      assertEquals(result.stdout.trim(), 'hello_world');
    });

    it('should work in interactive mode', async () => {
      // Interactive mode inherits stdio, so output is empty in result
      const result = await runCommand('deno', ['--version'], {
        interactive: true,
      });

      assertStrictEquals(result.success, true);
      assertStrictEquals(result.code, 0);
      // In interactive mode, stdout/stderr are empty strings
      assertStrictEquals(result.stdout, '');
      assertStrictEquals(result.stderr, '');
    });

    it('should default to current directory when cwd not specified', async () => {
      const currentDir = Deno.cwd();
      const result = await runCommand('pwd', []);

      assertStrictEquals(result.success, true);
      assertEquals(result.stdout.trim(), currentDir);
    });

    it('should handle commands with multiple arguments', async () => {
      const result = await runCommand('deno', [
        'eval',
        'console.log(Deno.args.join(","))',
        'arg1',
        'arg2',
        'arg3',
      ]);

      assertStrictEquals(result.success, true);
      assertEquals(result.stdout.trim(), 'arg1,arg2,arg3');
    });
  });

  describe('runCommandOrThrow', () => {
    it('should return result on success', async () => {
      const result = await runCommandOrThrow('deno', ['--version']);

      assertStrictEquals(result.success, true);
      assertStrictEquals(result.code, 0);
    });

    it('should throw CommandError on failure', async () => {
      await assertRejects(
        async () => {
          await runCommandOrThrow('deno', ['eval', 'Deno.exit(42)']);
        },
        CommandError,
      );
    });

    it('should include full result in CommandError', async () => {
      try {
        await runCommandOrThrow('deno', [
          'eval',
          'console.error("error output"); Deno.exit(1)',
        ]);
        throw new Error('Should have thrown');
      } catch (err) {
        if (err instanceof CommandError) {
          assertStrictEquals(err.exitCode, 1);
          assertEquals(err.stderr.includes('error output'), true);
          assertStrictEquals(err.result.success, false);
        } else {
          throw err;
        }
      }
    });

    it('should have accessible error properties', async () => {
      try {
        await runCommandOrThrow('deno', [
          'eval',
          'console.log("stdout content"); console.error("stderr content"); Deno.exit(2)',
        ]);
        throw new Error('Should have thrown');
      } catch (err) {
        if (err instanceof CommandError) {
          assertEquals(err.stdout.trim(), 'stdout content');
          assertEquals(err.stderr.trim(), 'stderr content');
          assertEquals(err.message.includes('exit code: 2'), true);
        } else {
          throw err;
        }
      }
    });
  });

  describe('CommandError', () => {
    it('should be instance of Error', () => {
      const result = {
        success: false,
        code: 1,
        stdout: '',
        stderr: 'error message',
        command: 'mock command',
      };
      const err = new CommandError('test error', result);

      assertEquals(err instanceof Error, true);
      assertEquals(err.message, 'test error');
    });

    it('should store result and provide accessors', () => {
      const result = {
        success: false,
        code: 42,
        stdout: 'output',
        stderr: 'error',
        command: 'mock command',
      };
      const err = new CommandError('test', result);

      assertStrictEquals(err.result, result);
      assertStrictEquals(err.exitCode, 42);
      assertStrictEquals(err.stdout, 'output');
      assertStrictEquals(err.stderr, 'error');
    });
  });
});
