import type { Integer } from '@epdoc/type';
import type * as Console from '../console/mod.ts';

/**
 * Defines the file logging mode.
 * - `a`: Append to the file if it exists, otherwise create it.
 * - `w`: Write to the file, overwriting it if it exists.
 * - `x`: Create a new file, throwing an error if it already exists.
 */
export type FileLogMode = 'a' | 'w' | 'x';

/**
 * Options for configuring the `File` transport.
 */
export interface FileOptions extends Console.Options {
  /**
   * The path to the log file.
   */
  filepath: string;
  /**
   * The file logging mode.
   * @default 'a'
   */
  mode?: FileLogMode;
  /**
   * The size of the buffer in bytes.
   * @default 4096
   */
  bufferSize?: Integer;
}
