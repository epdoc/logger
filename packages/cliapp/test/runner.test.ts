import * as assert from 'node:assert';
import { CommandError, runCommand, runCommandOrThrow } from '../src/runner.ts';

Deno.test('runner', async (t) => {
  await t.step('runCommand', async (t) => {
    await t.step('should run a command and return success for exit code 0', async () => {
      const result = await runCommand('deno', ['--version']);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.code, 0);
      assert.ok(result.stdout.includes('deno'));
      assert.strictEqual(result.stderr, '');
    });

    await t.step('should return failure for non-zero exit code', async () => {
      const result = await runCommand('deno', ['eval', 'Deno.exit(1)']);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.code, 1);
    });

    await t.step('should capture stderr on failure', async () => {
      // deno eval with syntax error produces stderr
      const result = await runCommand('deno', ['eval', 'invalid syntax here!!!']);

      assert.strictEqual(result.success, false);
      assert.ok(result.stderr.length > 0);
    });

    await t.step('should run command in specified working directory', async () => {
      const result = await runCommand('pwd', [], { cwd: '/tmp' });

      assert.strictEqual(result.success, true);
      // On macOS /tmp is a symlink to /private/tmp, so we check the path ends with /tmp
      assert.ok(result.stdout.trim().endsWith('/tmp'));
    });

    await t.step('should pass environment variables', async () => {
      const result = await runCommand('deno', [
        'eval',
        'console.log(Deno.env.get("TEST_VAR"))',
      ], {
        env: { TEST_VAR: 'hello_world' },
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.stdout.trim(), 'hello_world');
    });

    await t.step('should work in interactive mode', async () => {
      // Interactive mode inherits stdio, so output is empty in result
      const result = await runCommand('deno', ['--version'], {
        interactive: true,
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.code, 0);
      // In interactive mode, stdout/stderr are empty strings
      assert.strictEqual(result.stdout, '');
      assert.strictEqual(result.stderr, '');
    });

    await t.step('should default to current directory when cwd not specified', async () => {
      const currentDir = Deno.cwd();
      const result = await runCommand('pwd', []);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.stdout.trim(), currentDir);
    });

    await t.step('should handle commands with multiple arguments', async () => {
      const result = await runCommand('deno', [
        'eval',
        'console.log(Deno.args.join(","))',
        'arg1',
        'arg2',
        'arg3',
      ]);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.stdout.trim(), 'arg1,arg2,arg3');
    });
  });

  await t.step('runCommandOrThrow', async (t) => {
    await t.step('should return result on success', async () => {
      const result = await runCommandOrThrow('deno', ['--version']);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.code, 0);
    });

    await t.step('should throw CommandError on failure', async () => {
      await assert.rejects(
        async () => {
          await runCommandOrThrow('deno', ['eval', 'Deno.exit(42)']);
        },
        CommandError,
      );
    });

    await t.step('should include full result in CommandError', async () => {
      try {
        await runCommandOrThrow('deno', [
          'eval',
          'console.error("error output"); Deno.exit(1)',
        ]);
        throw new Error('Should have thrown');
      } catch (err) {
        if (err instanceof CommandError) {
          assert.strictEqual(err.exitCode, 1);
          assert.ok(err.stderr.includes('error output'));
          assert.strictEqual(err.result.success, false);
        } else {
          throw err;
        }
      }
    });

    await t.step('should have accessible error properties', async () => {
      try {
        await runCommandOrThrow('deno', [
          'eval',
          'console.log("stdout content"); console.error("stderr content"); Deno.exit(2)',
        ]);
        throw new Error('Should have thrown');
      } catch (err) {
        if (err instanceof CommandError) {
          assert.strictEqual(err.stdout.trim(), 'stdout content');
          assert.strictEqual(err.stderr.trim(), 'stderr content');
          assert.ok(err.message.includes('exit code: 2'));
        } else {
          throw err;
        }
      }
    });
  });

  await t.step('CommandError', async (t) => {
    await t.step('should be instance of Error', () => {
      const result = {
        success: false,
        code: 1,
        stdout: '',
        stderr: 'error message',
        command: 'mock command',
      };
      const err = new CommandError('test error', result);

      assert.strictEqual(err instanceof Error, true);
      assert.strictEqual(err.message, 'test error');
    });

    await t.step('should store result and provide accessors', () => {
      const result = {
        success: false,
        code: 42,
        stdout: 'output',
        stderr: 'error',
        command: 'mock command',
      };
      const err = new CommandError('test', result);

      assert.strictEqual(err.result, result);
      assert.strictEqual(err.exitCode, 42);
      assert.strictEqual(err.stdout, 'output');
      assert.strictEqual(err.stderr, 'error');
    });
  });
});
