export type Milliseconds = number;

// Instantiate once at module level to reuse across all instances
const decoder = new TextDecoder();
const encoder = new TextEncoder();

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
  /** If true then stdout and stderr are trimmed and split into arrays of strings */
  lines?: boolean;
}

export class CmdResult<T = void, E extends Error = Error> {
  #t0 = performance.now();
  success: boolean = false;
  code?: number;
  command: string = '';
  duration: Milliseconds = 0;
  _stdout?: Uint8Array;
  _stderr?: Uint8Array;
  data?: T;
  dryRun?: boolean;
  error?: E;

  constructor(init?: Omit<CmdResult<T, E>, 'stdout' | 'stderr' | 'stdoutLines' | 'stderrLines'>) {
    if (init) {
      this.success = init.success;
      this.code = init.code;
      this.command = init.command;
      this.duration = init.duration;
      this._stdout = init._stdout;
      this._stderr = init._stderr;
      this.data = init.data;
      this.dryRun = init.dryRun;
      this.error = init.error;
    }
  }

  static from<T = void, E extends Error = Error>(cmd: string, args: string[], opts: CmdOptions = {}): CmdResult<T, E> {
    const result = new CmdResult<T, E>();
    result.command = [cmd, ...args].join(' ');
    result.dryRun = !!opts.dryRun;
    return result;
  }

  asSuccess(): this {
    this.success = true;
    this.duration = performance.now() - this.#t0;
    return this;
  }

  setCode(code: number): this {
    this.code = code;
    this.success = code === 0;
    this.duration = performance.now() - this.#t0;
    return this;
  }

  setStdout(value: Uint8Array | string): this {
    this._stdout = typeof value === 'string' ? encoder.encode(value) : value;
    return this;
  }

  setStderr(value: Uint8Array | string): this {
    this._stderr = typeof value === 'string' ? encoder.encode(value) : value;
    return this;
  }

  get stdout(): string {
    if (!this._stdout) return '';
    return decoder.decode(this._stdout);
  }

  get stderr(): string {
    if (!this._stderr) return '';
    return decoder.decode(this._stderr);
  }

  /** Get stdout trimmed and split into an array of lines */
  get stdoutLines(): string[] {
    const cleaned = this.stdout.trim();
    if (!cleaned) return []; // Catches empty strings AND strings that were only whitespace
    return cleaned.split(/\r?\n/).map((line) => line.trim());
  }

  /** Get stderr trimmed and split into an array of lines */
  get stderrLines(): string[] {
    const cleaned = this.stderr!.trim();
    if (!cleaned) return []; // Catches empty strings AND strings that were only whitespace
    return cleaned.split(/\r?\n/).map((line) => line.trim());
  }
}
