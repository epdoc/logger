// Minimal MCP server for debugging connection issues
const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function writeMsg(msg: unknown): Promise<void> {
  const json = JSON.stringify(msg);
  const body = encoder.encode(json);
  const header = encoder.encode(`Content-Length: ${body.length}\r\n\r\n`);
  const combined = new Uint8Array(header.length + body.length);
  combined.set(header, 0);
  combined.set(body, header.length);
  const writer = Deno.stdout.writable.getWriter();
  try {
    await writer.write(combined);
  } finally {
    writer.releaseLock();
  }
}

const reader = Deno.stdin.readable.getReader();
let buffer = new Uint8Array(0);

while (true) {
  // Read until we have a complete message
  let headerEnd = -1;
  let sepLength = 0;
  while (headerEnd < 0) {
    const { done, value } = await reader.read();
    if (done) Deno.exit(0);
    const tmp = new Uint8Array(buffer.length + value.length);
    tmp.set(buffer, 0);
    tmp.set(value, buffer.length);
    buffer = tmp;

    for (let i = 0; i < buffer.length - 1; i++) {
      if (buffer[i] === 10 && buffer[i + 1] === 10) {
        headerEnd = i;
        sepLength = 2;
        break;
      }
      if (i < buffer.length - 3 && buffer[i] === 13 && buffer[i + 1] === 10 && buffer[i + 2] === 13 && buffer[i + 3] === 10) {
        headerEnd = i;
        sepLength = 4;
        break;
      }
    }
  }

  const headerStr = decoder.decode(buffer.slice(0, headerEnd));
  const match = headerStr.match(/Content-Length:\s*(\d+)/i);
  if (!match) {
    buffer = buffer.slice(headerEnd + sepLength);
    continue;
  }
  const cl = parseInt(match[1], 10);
  const bodyStart = headerEnd + sepLength;

  while (buffer.length < bodyStart + cl) {
    const { done, value } = await reader.read();
    if (done) Deno.exit(0);
    const tmp = new Uint8Array(buffer.length + value.length);
    tmp.set(buffer, 0);
    tmp.set(value, buffer.length);
    buffer = tmp;
  }

  const body = decoder.decode(buffer.slice(bodyStart, bodyStart + cl));
  buffer = buffer.slice(bodyStart + cl);
  const req = JSON.parse(body);

  if (req.id === undefined) continue; // notification

  if (req.method === 'initialize') {
    await writeMsg({
      jsonrpc: '2.0', id: req.id,
      result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'test', version: '0.1' } },
    });
  } else if (req.method === 'ping') {
    await writeMsg({ jsonrpc: '2.0', id: req.id, result: {} });
  } else if (req.method === 'tools/list') {
    await writeMsg({ jsonrpc: '2.0', id: req.id, result: { tools: [] } });
  } else {
    await writeMsg({ jsonrpc: '2.0', id: req.id, error: { code: -32601, message: `Not found: ${req.method}` } });
  }
}
