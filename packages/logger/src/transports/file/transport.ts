import type { Integer } from '@epdoc/type';
import type * as Level from '../../levels/mod.ts';
import type { LogMgr } from '../../logmgr.ts';
import type * as MsgBuilder from '../../message/mod.ts';
import * as Console from '../console/mod.ts';
import type { FileLogMode, FileOptions } from './types.ts';

const BUFSIZE = 4096;

/**
 * A transport for logging messages to a file.
 *
 * This class extends `Console` to provide file logging capabilities, with
 * support for buffering and different file modes.
 *
 * @example
 * ```ts
 * const logMgr = new LogMgr();
 * const fileTransport = new File(logMgr, { filepath: './app.log', mode: 'a' });
 * await fileTransport.setup();
 * logMgr.add(fileTransport);
 * ```
 */
export class FileTransport<M extends MsgBuilder.Base.Builder> extends Console.Transport<M> {
  protected _json = false;
  protected filepath: string;
  protected file: Deno.FsFile | undefined;
  protected encoder: TextEncoder = new TextEncoder();
  protected mode: FileLogMode = 'a';
  protected buf: Uint8Array;
  protected pointer: Integer = 0;
  protected unloadCallback = async (): Promise<void> => {
    await this.destroy();
  };

  /**
   * Creates an instance of the `File` transport.
   * @param {LogMgr<M>} logMgr - The log manager instance.
   * @param {FileOptions} opts - Configuration options for the transport.
   */
  constructor(logMgr: LogMgr<M>, opts: FileOptions) {
    super(logMgr, opts);
    this.filepath = opts.filepath;
    this.mode = opts.mode ?? 'a';
    this.buf = new Uint8Array(opts.bufferSize ?? BUFSIZE);
  }

  /**
   * Updates the transport's internal state when the log level threshold changes.
   * @returns {this} The current instance for method chaining.
   */
  override thresholdUpdated(): this {
    this._levelWidth = this._logMgr.logLevels.maxWidth(this._logMgr.threshold);
    return this;
  }

  /**
   * Returns a string representation of the transport.
   * @returns {string} A string identifying the transport and its file path.
   */
  override toString(): string {
    return `File[${this.filepath}]`;
  }

  /**
   * Sets up the file transport by opening the log file.
   * @returns {Promise<void>} A promise that resolves when the setup is complete.
   */
  override async setup(): Promise<void> {
    const openOpts: Deno.OpenOptions = {
      createNew: this.mode === 'x',
      create: this.mode !== 'x',
      append: this.mode === 'a',
      truncate: this.mode !== 'a',
      write: true,
    };
    this.file = await Deno.open(this.filepath, openOpts);
    this._resetBuffer();
    addEventListener('unload', this.unloadCallback);
  }

  /**
   * Outputs a log message to the file.
   *
   * @param {string} msg - The log message to be written.
   * @param {Level.Value} levelValue - The numerical value of the log level.
   * @returns {Promise<void>} A promise that resolves when the output is complete.
   */
  override async output(msg: string, levelValue: Level.Value): Promise<void> {
    const bytes = this.encoder.encode(msg + '\n');
    if (bytes.byteLength > this.buf.byteLength - this.pointer) {
      await this.flush();
    }
    if (bytes.byteLength > this.buf.byteLength) {
      await writeAll(this.file!, bytes);
    } else {
      this.buf.set(bytes, this.pointer);
      this.pointer += bytes.byteLength;
    }
    if (this.meetsFlushThresholdValue(levelValue)) {
      await this.flush();
    }
  }

  /**
   * Flushes the buffer to the file.
   * @returns {Promise<void>} A promise that resolves when the buffer is flushed.
   */
  async flush(): Promise<void> {
    if (this.pointer > 0 && this.file) {
      let written = 0;
      while (written < this.pointer) {
        written += await this.file.write(this.buf.subarray(written, this.pointer));
      }
      this._resetBuffer();
    }
  }

  /**
   * Resets the buffer pointer to the beginning.
   * @protected
   */
  protected _resetBuffer() {
    this.pointer = 0;
  }

  /**
   * Stops the file transport and flushes any remaining logs in the buffer.
   * @returns {Promise<void>} A promise that resolves when the transport is stopped.
   */
  override async stop(): Promise<void> {
    await this.flush();
    if (this.file) {
      this.file.close();
    }
    this.file = undefined;
  }

  /**
   * Destroys the file transport, stopping it and removing the unload event listener.
   * @returns {Promise<void>} A promise that resolves when the transport is destroyed.
   */
  override async destroy(): Promise<void> {
    await this.stop();
    removeEventListener('unload', this.unloadCallback);
  }
}

/**
 * Writes all data from a `Uint8Array` to a `Deno.FsFile`.
 *
 * @param {Deno.FsFile} writer - The file writer.
 * @param {Uint8Array} data - The data to be written.
 * @returns {Promise<void>} A promise that resolves when the data has been fully written.
 */
export async function writeAll(writer: Deno.FsFile, data: Uint8Array) {
  let nwritten = 0;
  while (nwritten < data.length) {
    nwritten += await writer.write(data.subarray(nwritten));
  }
}
