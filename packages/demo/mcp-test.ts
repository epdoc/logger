// Minimal MCP server for debugging connection issues.
// Messages are newline-delimited JSON lines, per the MCP stdio transport.
const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function writeMsg(msg: unknown): Promise<void> {
  const writer = Deno.stdout.writable.getWriter();
  try {
    await writer.write(encoder.encode(`${JSON.stringify(msg)}\n`));
  } finally {
    writer.releaseLock();
  }
}

const reader = Deno.stdin.readable.getReader();
let buffer = new Uint8Array(0);

async function readMsg(): Promise<Record<string, unknown> | null> {
  while (true) {
    const newline = buffer.indexOf(10);
    if (newline >= 0) {
      const line = decoder.decode(buffer.slice(0, newline)).replace(/\r$/, '');
      buffer = buffer.slice(newline + 1);
      if (line.trim() === '') continue;
      return JSON.parse(line) as Record<string, unknown>;
    }

    const { done, value } = await reader.read();
    if (done) return null;
    const tmp = new Uint8Array(buffer.length + value.length);
    tmp.set(buffer, 0);
    tmp.set(value, buffer.length);
    buffer = tmp;
  }
}

while (true) {
  const req = await readMsg();
  if (req === null) Deno.exit(0);

  const id = req.id;
  if (id === undefined) continue; // notification

  if (req.method === 'initialize') {
    await writeMsg({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'test', version: '0.1' },
      },
    });
  } else if (req.method === 'ping') {
    await writeMsg({ jsonrpc: '2.0', id, result: {} });
  } else if (req.method === 'tools/list') {
    await writeMsg({ jsonrpc: '2.0', id, result: { tools: [] } });
  } else {
    await writeMsg({ jsonrpc: '2.0', id, error: { code: -32601, message: `Not found: ${req.method}` } });
  }
}
