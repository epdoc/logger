import type { OutputFormatType, TransportBaseOptions } from '../types.ts';

export type StyleFormatterFn = (s: string) => string;

/**
 * The complete set of style keys used by {@link ConsoleTransport} for
 * formatting metadata columns.
 *
 * These styles are applied to transport columns (e.g. session ID, request ID,
 * elapsed time) rather than the message content itself. Keys are prefixed with
 * underscore to distinguish them from message content styles.
 */
export type TransportStyleKey =
  | '_reqId'
  | '_sid'
  | '_package'
  | '_action'
  | '_plain'
  | '_suffix'
  | '_elapsed'
  | '_level'
  | '_source'
  | '_errorPrefix'
  | '_warnPrefix'
  | '_infoPrefix'
  | '_verbosePrefix'
  | '_debugPrefix'
  | '_sillyPrefix'
  | '_httpPrefix'
  | '_timePrefix';

/**
 * A style map that satisfies all keys required by {@link ConsoleTransport}.
 *
 * The intersection with `Record<string, StyleFormatterFn>` allows extra keys
 * while the `Record<TransportStyleKey, ...>` part ensures all required keys
 * are present at compile time.
 */
export type TransportStyleMap =
  & Record<TransportStyleKey, StyleFormatterFn>
  & Record<string, StyleFormatterFn>;

/**
 * Options for configuring the `Console` transport.
 */
export interface Options extends TransportBaseOptions {
  /**
   * The output format to use.
   * @default 'text'
   */
  format?: OutputFormatType;
  /**
   * Whether to use colors in the output.
   * @default true
   */
  color?: boolean;
  /**
   * Whether to write output to stderr instead of stdout. This is necessary for some environments
   * (like mcp) where stdout is not available.
   * @default false
   */
  useStderr?: boolean;
}
