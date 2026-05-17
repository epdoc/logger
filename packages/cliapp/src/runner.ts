/**
 * Command runner utilities for executing external commands.
 *
 * @module @epdoc/cliapp/runner
 *
 * Provides a typed wrapper around Deno.Command for running external processes.
 * Supports both captured output (for programmatic use) and inherited stdio
 * (for interactive commands).
 *
 * @example
 * ```typescript
 * import { runCommand, type CommandResult } from '@epdoc/cliapp/runner';
 *
 * // Run with captured output
 * const result = await runCommand('git', ['status'], '/my/project');
 * if (result.success) {
 *   console.log(result.stdout);
 * }
 *
 * // Run interactively (inherit stdio)
 * await runCommand('deno', ['publish'], '/my/project', { interactive: true });
 * ```
 */

/** Result of a command execution */
export interface CmdResult {
  /** Whether the command exited with code 0 */
  success: boolean;
  /** The process exit code */
  code: number;
  /** Standard output (empty string in interactive mode) */
  stdout: string;
  /** Standard error (empty string in interactive mode) */
  stderr: string;
  /** The command that was run (for logging purposes) */
  command: string;
}

/** Options for running a command */
export interface CmdOptions {
  /** Working directory for the command. Defaults to current directory. */
  cwd?: string;
  /**
   * If true, inherits stdin/stdout/stderr for interactive commands.
   * If false (default), captures output and returns it in the result.
   */
  interactive?: boolean;
  /** Environment variables to set for the command */
  env?: Record<string, string>;
  /** Clear environment variables and only use those specified in `env`. Default: false */
  clearEnv?: boolean;
  /** If true then do not execute the command. We will mock the result. */
  dryRun?: boolean;
}

/**
 * Run an external command and return the result.
 *
 * A typed wrapper around Deno.Command that provides consistent handling
 * for both captured-output and interactive command execution.
 *
 * @param cmd - The command to execute (e.g., 'git', 'deno')
 * @param args - Array of command arguments
 * @param opts - Options for command execution
 * @returns Promise resolving to the command result
 *
 * @example Captured output (default)
 * ```typescript
 * const result = await runCommand('git', ['rev-parse', '--show-toplevel'], {
 *   cwd: '/my/repo'
 * });
 * if (result.success) {
 *   const rootDir = result.stdout.trim();
 * }
 * ```
 *
 * @example Interactive mode (inherit stdio)
 * ```typescript
 * // For commands that need user interaction
 * const result = await runCommand('deno', ['publish'], {
 *   cwd: '/my/project',
 *   interactive: true
 * });
 * ```
 *
 * @example With environment variables
 * ```typescript
 * const result = await runCommand('node', ['script.js'], {
 *   env: { NODE_ENV: 'production' }
 * });
 * ```
 */
export async function runCommand(
  cmd: string,
  args: string[],
  opts: CmdOptions = {},
): Promise<CmdResult> {
  const cwd = opts.cwd ?? Deno.cwd();
  const interactive = opts.interactive ?? false;
  const commandStr = [cmd, ...args].join(' ');

  if (opts.dryRun) {
    return {
      success: true,
      code: 0,
      stdout: '',
      stderr: '',
      command: commandStr,
    };
  }

  if (interactive) {
    // For interactive commands, inherit stdio
    const command = new Deno.Command(cmd, {
      args,
      cwd,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
      env: opts.env,
      clearEnv: opts.clearEnv,
    });

    const child = command.spawn();

    // Handle SIGINT by forwarding it to the child process
    const sigintHandler = () => {
      child.kill('SIGINT');
    };
    Deno.addSignalListener('SIGINT', sigintHandler);

    try {
      const { code } = await child.output();

      return {
        success: code === 0,
        code,
        stdout: '',
        stderr: '',
        command: commandStr,
      };
    } finally {
      Deno.removeSignalListener('SIGINT', sigintHandler);
    }
  } else {
    // For non-interactive commands, capture output
    const command = new Deno.Command(cmd, {
      args,
      cwd,
      stdout: 'piped',
      stderr: 'piped',
      env: opts.env,
      clearEnv: opts.clearEnv,
    });

    const { code, stdout, stderr } = await command.output();

    return {
      success: code === 0,
      code,
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
      command: commandStr,
    };
  }
}

/**
 * Run a command and throw an error if it fails.
 *
 * Same as `runCommand` but throws a `CommandError` on non-zero exit code.
 *
 * @param cmd - The command to execute
 * @param args - Array of command arguments
 * @param opts - Options for command execution
 * @returns Promise resolving to the command result
 * @throws {CommandError} If the command exits with non-zero code
 *
 * @example
 * ```typescript
 * try {
 *   const result = await runCommandOrThrow('git', ['push']);
 *   console.log('Push succeeded');
 * } catch (err) {
 *   if (err instanceof CommandError) {
 *     console.error('Push failed:', err.stderr);
 *   }
 * }
 * ```
 */
export async function runCommandOrThrow(
  cmd: string,
  args: string[],
  opts: CmdOptions = {},
): Promise<CmdResult> {
  const result = await runCommand(cmd, args, opts);

  if (!result.success) {
    throw new CommandError(
      `Command failed: ${cmd} ${args.join(' ')} (exit code: ${result.code})`,
      result,
    );
  }

  return result;
}

/**
 * Error thrown when a command exits with non-zero status.
 *
 * Contains the full CommandResult for inspection.
 */
export class CommandError extends Error {
  /** The command result that caused this error */
  readonly result: CmdResult;

  constructor(message: string, result: CmdResult) {
    super(message);
    this.result = result;
  }

  /** The stdout from the failed command */
  get stdout(): string {
    return this.result.stdout;
  }

  /** The stderr from the failed command */
  get stderr(): string {
    return this.result.stderr;
  }

  /** The exit code from the failed command */
  get exitCode(): number {
    return this.result.code;
  }
}
