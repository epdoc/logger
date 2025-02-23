import type { Integer } from '@epdoc/type';
import type { LogMgr } from '../logmgr.ts';
import type * as MsgBuilder from '../message/index.ts';
import { Console, type ConsoleOptions } from './console.ts';

const BUFSIZE = 4096;

// export function factoryMethod<M extends MsgBuilder.IBasic>(logMgr: LogMgr<M>, opts: HandlerOptions) {
//   return new Handler<M>(logMgr, opts);
// }

export type FileLogMode = 'a' | 'w' | 'x';

export interface FileOptions extends ConsoleOptions {
  filepath: string;
  mode?: FileLogMode;
  bufferSize?: Integer;
}

export class File<M extends MsgBuilder.IBasic> extends Console<M> {
  protected _json = false;
  protected filepath: string;
  protected file: Deno.FsFile | undefined;
  protected encoder: TextEncoder = new TextEncoder();
  protected mode: FileLogMode = 'a';
  protected buf: Uint8Array;
  protected pointer: Integer = 0;
  protected unloadCallback = (() => this.destroy()).bind(this);

  constructor(logMgr: LogMgr<M>, opts: FileOptions) {
    super(logMgr, opts);
    this.filepath = opts.filepath;
    this.mode = opts.mode ?? 'a';
    this.buf = new Uint8Array(opts.bufferSize ?? BUFSIZE);
  }

  override thresholdUpdated(): this {
    this._levelWidth = this._logMgr.logLevels.maxWidth(this._logMgr.threshold);
    return this;
  }

  override toString(): string {
    return `File[${this.filepath}]`;
  }

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
  }

  override async output(msg: string): Promise<void> {
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
  }

  async flush(): Promise<void> {
    if (this.pointer > 0 && this.file) {
      let written = 0;
      while (written < this.pointer) {
        written += await this.file.write(this.buf.subarray(written, this.pointer));
      }
      this._resetBuffer();
    }
  }

  protected _resetBuffer() {
    this.pointer = 0;
  }

  override async stop(): Promise<void> {
    await this.flush();
    if (this.file) {
      this.file.close();
    }
    this.file = undefined;
  }

  // async end(): Promise<void> {
  //   await this.flush();
  //   this._bReady = false;
  //   if (this._stream) {
  //     this._stream.end();
  //   }
  // }

  override async destroy(): Promise<void> {
    await this.stop();
    removeEventListener('unload', this.unloadCallback);
  }
}

export async function writeAll(writer: Deno.FsFile, data: Uint8Array) {
  let nwritten = 0;
  while (nwritten < data.length) {
    nwritten += await writer.write(data.subarray(nwritten));
  }
}
