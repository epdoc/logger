/**
 * @file MCP JSON-RPC protocol handler over stdio
 * @description Implements the MCP stdio transport protocol using Content-Length
 * delimited JSON-RPC 2.0 messages over stdin/stdout.
 * @module
 */

import type * as Mcp from './types.ts';

/**
 * Reads a single MCP message from stdin using Content-Length framing.
 *
 * The MCP stdio transport uses HTTP-style headers with Content-Length
 * as the delimiter between messages:
 * ```
 * Content-Length: <byte-length>\r\n
 * \r\n
 * <JSON-RPC message>
 * ```
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
    // Look for the header/body separator in the buffer
    const headerInfo = findHeader(buffer.data);
    if (headerInfo) {
      const headerEnd = headerInfo.index;
      const sepLength = headerInfo.length;

      // Parse the Content-Length header
      const headerStr = decoder.decode(buffer.data.slice(0, headerEnd));
      const contentLength = parseContentLength(headerStr);
      if (contentLength === null) {
        // Malformed header, skip to next message
        buffer.data = buffer.data.slice(headerEnd + sepLength);
        continue;
      }

      const bodyStart = headerEnd + sepLength;
      const totalNeeded = bodyStart + contentLength;

      // Read more data if we don't have the full body yet
      while (buffer.data.length < totalNeeded) {
        const { done, value } = await reader.read();
        if (done) return null;
        buffer.data = concatUint8Arrays(buffer.data, value);
      }

      // Extract the message body
      const body = buffer.data.slice(bodyStart, totalNeeded);
      buffer.data = buffer.data.slice(totalNeeded);

      const json = decoder.decode(body);
      return JSON.parse(json) as Mcp.JsonRpcRequest;
    }

    // Need more data
    const { done, value } = await reader.read();
    if (done) return null;
    buffer.data = concatUint8Arrays(buffer.data, value);
  }
}

/**
 * Writes a JSON-RPC response to stdout using Content-Length framing.
 *
 * @param msg - The JSON-RPC response to send
 */
export async function writeMessage(msg: Mcp.JsonRpcResponse): Promise<void> {
  const encoder = new TextEncoder();
  const json = JSON.stringify(msg);
  const bodyBytes = encoder.encode(json);
  const header = `Content-Length: ${bodyBytes.length}\r\n\r\n`;
  const headerBytes = encoder.encode(header);

  const output = concatUint8Arrays(headerBytes, bodyBytes);
  const writer = Deno.stdout.writable.getWriter();
  try {
    await writer.write(output);
  } finally {
    writer.releaseLock();
  }
}

/**
 * Finds the position and length of the header/body separator in a Uint8Array.
 * Supports both \r\n\r\n and \n\n.
 *
 * @returns Object with index and length, or null if not found
 */
function findHeader(data: Uint8Array): { index: number; length: number } | null {
  for (let i = 0; i < data.length - 1; i++) {
    // Check for \n\n
    if (data[i] === 10 && data[i + 1] === 10) {
      return { index: i, length: 2 };
    }
    // Check for \r\n\r\n
    if (i < data.length - 3 && data[i] === 13 && data[i + 1] === 10 && data[i + 2] === 13 && data[i + 3] === 10) {
      return { index: i, length: 4 };
    }
  }
  return null;
}

/**
 * Parses the Content-Length value from a header string.
 *
 * @returns The content length in bytes, or null if parsing fails
 */
function parseContentLength(headerStr: string): number | null {
  const match = headerStr.match(/Content-Length:\s*(\d+)/i);
  if (!match) return null;
  return parseInt(match[1], 10);
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
