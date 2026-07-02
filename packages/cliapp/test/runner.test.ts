import { assert, assertEquals, assertRejects, assertStrictEquals } from '@std/assert';
import * as Runner from '../src/runner/mod.ts';

Deno.test('runner', async (t) => {
  await t.step('runCommand', async (t) => {
    await t.step('should run a command and return success for exit code 0', async () => {
      const result = await Runner.runCommand('deno', ['--version']);

      assertStrictEquals(result.success, true);
      assertStrictEquals(result.code, 0);
      assert(result.stdout.includes('deno'));
      assertStrictEquals(result.stderr, '');
    });

    await t.step('should return failure for non-zero exit code', async () => {
      const result = await Runner.runCommand('deno', ['eval', 'Deno.exit(1)']);

      assertStrictEquals(result.success, false);
      assertStrictEquals(result.code, 1);
    });

    await t.step('should capture stderr on failure', async () => {
      // deno eval with syntax error produces stderr
      const result = await Runner.runCommand('deno', ['eval', 'invalid syntax here!!!']);

      assertStrictEquals(result.success, false);
      assert(result.stderr.length > 0);
    });

    await t.step('should run command in specified working directory', async () => {
      const result = await Runner.runCommand('pwd', [], { cwd: '/tmp' });

      assertStrictEquals(result.success, true);
      // On macOS /tmp is a symlink to /private/tmp, so we check the path ends with /tmp
      assert(result.stdout.trim().endsWith('/tmp'));
    });

    await t.step('should pass environment variables', async () => {
      const result = await Runner.runCommand('deno', [
        'eval',
        'console.log(Deno.env.get("TEST_VAR"))',
      ], {
        env: { TEST_VAR: 'hello_world' },
      });

      assertStrictEquals(result.success, true);
      assertStrictEquals(result.stdout.trim(), 'hello_world');
    });

    await t.step('should work in interactive mode', async () => {
      // Interactive mode inherits stdio, so output is empty in result
      const result = await Runner.runCommand('deno', ['--version'], {
        interactive: true,
      });

      assertStrictEquals(result.success, true);
      assertStrictEquals(result.code, 0);
      // In interactive mode, stdout/stderr are empty strings
      assertStrictEquals(result.stdout, '');
      assertStrictEquals(result.stderr, '');
    });

    await t.step('should default to current directory when cwd not specified', async () => {
      const currentDir = Deno.cwd();
      const result = await Runner.runCommand('pwd', []);

      assertStrictEquals(result.success, true);
      assertStrictEquals(result.stdout.trim(), currentDir);
    });

    await t.step('should handle commands with multiple arguments', async () => {
      const result = await Runner.runCommand('deno', [
        'eval',
        'console.log(Deno.args.join(","))',
        'arg1',
        'arg2',
        'arg3',
      ]);

      assertStrictEquals(result.success, true);
      assertStrictEquals(result.stdout.trim(), 'arg1,arg2,arg3');
    });

    await t.step('should return success without executing when dryRun is true', async () => {
      const result = await Runner.runCommand('nonexistent-command', ['--invalid'], {
        dryRun: true,
      });

      assertStrictEquals(result.success, true);
      assertStrictEquals(result.dryRun, true);
      assertStrictEquals(result.code, undefined);
      assertStrictEquals(result.stdout, '');
      assertStrictEquals(result.stderr, '');
    });

    await t.step('should clear inherited environment when clearEnv is true', async () => {
      const result = await Runner.runCommand('deno', [
        'eval',
        'console.log(Deno.env.get("TEST_VAR") ?? "undefined"); console.log(Deno.env.get("PATH") ?? "undefined");',
      ], {
        clearEnv: true,
        env: { TEST_VAR: 'hello' },
      });

      assertStrictEquals(result.success, true);
      const lines = result.stdoutLines;
      assertStrictEquals(lines[0], 'hello');
      assert(lines[1], 'PATH should be set (Deno injects its own)');
      assert(lines[1] !== Deno.env.get('PATH'), 'Inherited PATH should be cleared');
    });

    await t.step('should capture stderr even when exit code is 0', async () => {
      const result = await Runner.runCommand('deno', [
        'eval',
        'console.error("warning message"); console.log("normal output");',
      ]);

      assertStrictEquals(result.success, true);
      assertStrictEquals(result.stderr.trim(), 'warning message');
    });
  });

  await t.step('runCommandOrThrow', async (t) => {
    await t.step('should return result on success', async () => {
      const result = await Runner.runCommandOrThrow('deno', ['--version']);

      assertStrictEquals(result.success, true);
      assertStrictEquals(result.code, 0);
    });

    await t.step('should throw CommandError on failure', async () => {
      await assertRejects(
        () => Runner.runCommandOrThrow('deno', ['eval', 'Deno.exit(42)']),
        Runner.Error,
      );
    });

    await t.step('should include full result in CommandError', async () => {
      try {
        await Runner.runCommandOrThrow('deno', [
          'eval',
          'console.error("error output"); Deno.exit(1)',
        ]);
        throw new Error('Should have thrown');
      } catch (err) {
        if (err instanceof Runner.Error) {
          assertStrictEquals(err.exitCode, 1);
          assert(err.stderr.includes('error output'));
          assertStrictEquals(err.result.success, false);
        } else {
          throw err;
        }
      }
    });

    await t.step('should have accessible error properties', async () => {
      try {
        await Runner.runCommandOrThrow('deno', [
          'eval',
          'console.log("stdout content"); console.error("stderr content"); Deno.exit(2)',
        ]);
        throw new Error('Should have thrown');
      } catch (err) {
        if (err instanceof Runner.Error) {
          assertStrictEquals(err.stdout.trim(), 'stdout content');
          assertStrictEquals(err.stderr.trim(), 'stderr content');
          assert(err.message.includes('exit code: 2'));
        } else {
          throw err;
        }
      }
    });

    await t.step('should not throw when dryRun is true', async () => {
      const result = await Runner.runCommandOrThrow('nonexistent', [], { dryRun: true });

      assertStrictEquals(result.success, true);
      assertStrictEquals(result.dryRun, true);
    });
  });

  await t.step('CommandError', async (t) => {
    await t.step('should be instance of Error', () => {
      const result = Runner.Result.from('mock', ['command']).setCode(1).setStderr('error message').setStdout('');
      const err = new Runner.Error('test error', result);

      assertStrictEquals(err instanceof Runner.Error, true);
      assertStrictEquals(err instanceof Error, true);
      assertStrictEquals(err.message, 'test error');
    });

    await t.step('should store result and provide accessors', () => {
      const result = Runner.Result.from('mock', ['command']).setCode(42).setStderr('error').setStdout('output');
      const err = new Runner.Error('test', result);

      assertStrictEquals(err.result, result);
      assertStrictEquals(err.exitCode, 42);
      assertStrictEquals(err.stdout, 'output');
      assertStrictEquals(err.stderr, 'error');
    });
  });

  await t.step('CmdResult', async (t) => {
    await t.step('should provide duration after execution', async () => {
      const result = await Runner.runCommand('deno', ['--version']);

      assert(result.duration > 0, `expected positive duration, got ${result.duration}`);
    });

    await t.step('should split stdout into lines', async () => {
      const result = await Runner.runCommand('deno', [
        'eval',
        'console.log("line1"); console.log("line2"); console.log("line3");',
      ]);

      assertEquals(result.stdoutLines, ['line1', 'line2', 'line3']);
    });

    await t.step('should split stderr into lines', async () => {
      const result = await Runner.runCommand('deno', [
        'eval',
        'console.error("err1"); console.error("err2"); Deno.exit(1);',
      ]);

      assertStrictEquals(result.success, false);
      assertEquals(result.stderrLines, ['err1', 'err2']);
    });

    await t.step('should create a CmdResult via static from() factory', () => {
      const result = Runner.Result.from('mock', ['cmd', '--flag']);

      assertStrictEquals(result.command, 'mock cmd --flag');
      assertStrictEquals(result.success, false);
      assertStrictEquals(result.dryRun, false);
      assertStrictEquals(result.duration, 0);
    });

    await t.step('should have empty stdout and stderr for uninitialized result', () => {
      const result = Runner.Result.from('test', []);

      assertStrictEquals(result.stdout, '');
      assertStrictEquals(result.stderr, '');
      assertEquals(result.stdoutLines, []);
      assertEquals(result.stderrLines, []);
    });

    await t.step('should mark dryRun on result from options', () => {
      const result = Runner.Result.from('test', ['arg'], { dryRun: true });

      assertStrictEquals(result.dryRun, true);
    });

    await t.step('should support typed data payload', () => {
      const result = new Runner.Result<{ value: number }>();
      result.data = { value: 42 };

      assertStrictEquals(result.data?.value, 42);
    });
  });
});
