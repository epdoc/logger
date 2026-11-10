/**
 * @file MCP JSON-RPC protocol handler over stdio
 * @description Implements the MCP stdio transport protocol using
 * newline-delimited JSON-RPC 2.0 messages over stdin/stdout.
 * @module
 */

import type * as Mcp from './types.ts';

/**
 * Reads a single MCP message from stdin.
 *
 * The MCP stdio transport delimits messages by newline: each message is one
 * JSON-RPC request, notification, or response on a single line, and must not
 * contain embedded newlines. A trailing carriage return is tolerated so that
 * clients which send CRLF still work.
 *
 * @param reader - A ReadableStreamDefaultReader for stdin
 * @param buffer - Mutable buffer object for carrying over partial reads
 * @returns The parsed JSON-RPC request, or null if stdin closes
 */
export async function readMessage(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  buffer: { data: Uint8Array },
): Promise<Mcp.JsonRpcRequest | null> {
  const decoder = new TextDecoder();

  while (true) {
    const newline = buffer.data.indexOf(10);
    if (newline >= 0) {
      const line = buffer.data.slice(0, newline);
      buffer.data = buffer.data.slice(newline + 1);

      const text = decoder.decode(line).replace(/\r$/, '');
      if (text.trim() === '') {
        continue;
      }
      return JSON.parse(text) as Mcp.JsonRpcRequest;
    }

    const { done, value } = await reader.read();
    if (done) {
      // Tolerate a final message that the client did not terminate with a newline.
      const text = decoder.decode(buffer.data).replace(/\r$/, '');
      buffer.data = new Uint8Array(0);
      if (text.trim() === '') {
        return null;
      }
      return JSON.parse(text) as Mcp.JsonRpcRequest;
    }
    buffer.data = concatUint8Arrays(buffer.data, value);
  }
}

/**
 * Writes a JSON-RPC response to stdout as a single newline-terminated line.
 *
 * @param msg - The JSON-RPC response to send
 */
export function writeMessage(msg: Mcp.JsonRpcResponse): void {
  const output = frameMessage(msg);
  // writeSync may write fewer bytes than it is given (a non-blocking stdout, a
  // large payload). Loop until the whole message is out, otherwise the client
  // sees a truncated JSON line and the stream desynchronises.
  let offset = 0;
  while (offset < output.length) {
    const written = Deno.stdout.writeSync(output.subarray(offset));
    if (written <= 0) {
      break;
    }
    offset += written;
  }
}

/**
 * Encode a JSON-RPC response as a newline-terminated UTF-8 line.
 *
 * Exported for tests: a large payload is exactly where the old single
 * `writeSync` leaked, so the encoding has to be verifiable without stdout.
 */
export function frameMessage(msg: Mcp.JsonRpcResponse): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`${JSON.stringify(msg)}\n`);
}

/**
 * Concatenates two Uint8Arrays into a new Uint8Array.
 */
function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}
