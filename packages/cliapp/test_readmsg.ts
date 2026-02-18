import { readMessage } from './src/mcp/protocol.ts';

console.error("Starting readMessage test...");
const reader = Deno.stdin.readable.getReader();
const buffer = { data: new Uint8Array(0) };

const request = await readMessage(reader, buffer);
if (request) {
  console.error("Received request:", request.method);
  console.error("Full request:", JSON.stringify(request));
} else {
  console.error("No request received (null)");
}
