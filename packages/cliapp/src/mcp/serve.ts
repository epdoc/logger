/**
 * @file MCP server entry point for cliapp-based applications
 * @description Launches a cliapp command tree as an MCP server, allowing
 * CLI commands to be invoked as MCP tools by AI assistants.
 *
 * The caller creates and configures the root context (including logging,
 * transports, and thresholds) the same way they would for CLI mode. The
 * serve function then:
 * 1. Adds a BufferTransport (once) for capturing per-call output
 * 2. Disables any ConsoleTransport (stdout is reserved for MCP protocol)
 * 3. Introspects the command tree to build MCP tool definitions
 * 4. For each tool call, creates a child context with unique reqId
 *
 * @module
 */

import * as Log from '@epdoc/logger';
import type * as Ctx from '../context.ts';
import { extractToolDefinitions } from './introspect.ts';
import { readMessage, writeMessage } from './protocol.ts';
import { McpResultCollector } from './result.ts';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  McpServeOptions,
  McpTextContent,
  McpToolCallParams,
  McpToolResult,
  ToolDefinition,
} from './types.ts';

/**
 * Launches a cliapp command hierarchy as an MCP server over stdio.
 *
 * This function transforms any cliapp-based CLI application into an MCP server
 * that AI assistants can interact with. Each leaf command in the command tree
 * becomes an MCP tool with its options and arguments exposed as the tool's
 * input schema.
 *
 * The caller configures the context the same way as for CLI mode. The serve
 * function manages the MCP protocol, creating child contexts per tool call.
 *
 * @param ctx - Fully configured root context (with logging already set up)
 * @param opts - MCP server options including the command factory
 *
 * @example
 * ```typescript
 * // main.ts — single entry point for both CLI and MCP modes
 * if (Deno.args.includes('--mcp')) {
 *   const ctx = new App.Ctx.RootContext(pkg);
 *   await ctx.setupLogging({ pkg: 'mcp' });
 *   await CliApp.Mcp.serve(ctx, {
 *     createCommand: (childCtx) => new App.Cmd.Root(childCtx),
 *   });
 * } else {
 *   const ctx = new App.Ctx.RootContext(pkg);
 *   await ctx.setupLogging({ pkg: 'app' });
 *   const rootCmd = new App.Cmd.Root(ctx);
 *   await CliApp.run(ctx, rootCmd);
 * }
 * ```
 */
export async function serve<TCtx extends Ctx.AbstractBase>(
  ctx: TCtx,
  opts: McpServeOptions<TCtx>,
): Promise<void> {
  // 1. Disable any console transports — stdout is reserved for MCP protocol.
  //    In the future, a ConsoleTransport configured for stderr would remain enabled.
  for (const transport of ctx.logMgr.transportMgr.transports) {
    if (transport.type === 'console') {
      transport.setEnabled(false);
    }
  }

  // 2. Add a BufferTransport (once) for capturing per-call output
  const bufferTransport = new Log.Transport.Buffer.Transport(ctx.logMgr, { maxEntries: 10000 });
  await ctx.logMgr.addTransport(bufferTransport);

  // 3. Introspect the command tree for tool definitions using the root context
  const introspectCmd = opts.createCommand(ctx);
  await introspectCmd.init();
  const tools = extractToolDefinitions(introspectCmd.commander);

  ctx.log.info.text(`MCP server starting`).emit();
  ctx.log.info.text(`Registered ${tools.length} tool(s): ${tools.map((t) => t.name).join(', ')}`).emit();

  // 4. Start the MCP protocol loop
  const reader = Deno.stdin.readable.getReader();
  const readBuffer = { data: new Uint8Array(0) };

  while (true) {
    const request = await readMessage(reader, readBuffer);
    if (request === null) {
      ctx.log.info.text('stdin closed, shutting down').emit();
      break;
    }

    const response = await handleRequest(request, ctx, opts, tools, bufferTransport);
    if (response) {
      await writeMessage(response);
    }
  }

  await ctx.close();
}

/**
 * Dispatches an incoming JSON-RPC request to the appropriate handler.
 */
async function handleRequest<TCtx extends Ctx.AbstractBase>(
  request: JsonRpcRequest,
  ctx: TCtx,
  opts: McpServeOptions<TCtx>,
  tools: ToolDefinition[],
  bufferTransport: Log.Transport.Buffer.Transport,
): Promise<JsonRpcResponse | null> {
  // Notifications (no id) don't need responses
  if (request.id === undefined) {
    return null;
  }

  if (request.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: ctx.pkg.name, version: ctx.pkg.version },
      },
    };
  }

  if (request.method === 'ping') {
    return { jsonrpc: '2.0', id: request.id, result: {} };
  }

  if (request.method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools },
    };
  }

  if (request.method === 'tools/call') {
    const params = request.params as unknown as McpToolCallParams;
    const result = await executeToolCall(params, ctx, opts, tools, bufferTransport);
    return { jsonrpc: '2.0', id: request.id, result };
  }

  // Method not found
  return {
    jsonrpc: '2.0',
    id: request.id,
    error: { code: -32601, message: `Method not found: ${request.method}` },
  };
}

/**
 * Executes an MCP tool call by creating a child context and running the command.
 *
 * For each tool call:
 * 1. Clears the shared BufferTransport
 * 2. Creates a child context from the root with a unique reqId
 * 3. Attaches an McpResultCollector for explicit result output
 * 4. Constructs synthetic CLI arguments and executes via Commander.js
 * 5. Collects results from McpResultCollector or BufferTransport fallback
 */
async function executeToolCall<TCtx extends Ctx.AbstractBase>(
  params: McpToolCallParams,
  rootCtx: TCtx,
  opts: McpServeOptions<TCtx>,
  tools: ToolDefinition[],
  bufferTransport: Log.Transport.Buffer.Transport,
): Promise<McpToolResult> {
  const tool = tools.find((t) => t.name === params.name);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${params.name}` }],
      isError: true,
    };
  }

  const reqId = crypto.randomUUID().slice(0, 8);

  try {
    // 1. Clear the buffer from any previous call
    bufferTransport.clear();

    // 2. Create a child context with unique reqId (inherits logMgr + transports)
    const childCtx = new (rootCtx.constructor as { new (parent: TCtx, params: Log.IGetChildParams): TCtx })(
      rootCtx,
      { pkg: params.name, reqId },
    );

    // 3. Attach McpResultCollector for explicit response output
    const resultCollector = new McpResultCollector('buffer');
    childCtx.mcpResult = resultCollector;

    rootCtx.log.debug.text(`Executing tool: ${params.name}`).emit();

    // 4. Create and initialize a fresh command tree with the child context
    const rootCmd = opts.createCommand(childCtx);
    await rootCmd.init();
    rootCmd.commander.exitOverride();

    // 5. Construct synthetic argv and execute
    const argv = buildSyntheticArgv(params, tool, rootCtx.pkg.name);

    try {
      await rootCmd.commander.parseAsync(argv, { from: 'user' });
    } catch (err) {
      const error = err as Error & { exitCode?: number };
      if (error.exitCode !== undefined && error.exitCode === 0) {
        // Help or version output — not an error
      } else {
        throw err;
      }
    }

    // 6. Collect results — prefer explicit mcpResult content over log output
    const content: McpTextContent[] = [];

    if (resultCollector.hasEntries) {
      content.push(...resultCollector.getEntries());
    } else {
      // Fall back to captured log output (for commands not yet MCP-aware)
      const logText = bufferTransport.getMessages().filter((m) => m.length > 0).join('\n');
      if (logText.length > 0) {
        content.push({ type: 'text', text: logText });
      }

      const entries = bufferTransport.getEntries();
      const dataEntries: unknown[] = [];
      for (const entry of entries) {
        if (entry.data !== undefined) {
          dataEntries.push(entry.data);
        }
      }
      if (dataEntries.length > 0) {
        content.push({ type: 'text', text: JSON.stringify(dataEntries, null, 2) });
      }
    }

    if (content.length === 0) {
      content.push({ type: 'text', text: 'Command completed successfully.' });
    }

    return { content };
  } catch (err) {
    const error = err as Error;
    rootCtx.log.error.text(`Tool error: ${params.name}`).err(error).emit();
    return {
      content: [{ type: 'text', text: `Error executing ${params.name}: ${error.message}` }],
      isError: true,
    };
  }
}

/**
 * Converts MCP tool call arguments into a synthetic CLI argv array
 * suitable for Commander.js parseAsync.
 *
 * The tool name (e.g., "app_query") is split on underscores to reconstruct
 * the command path (e.g., ["query"]). Named options are prefixed with `--`
 * and positional arguments are appended at the end in their declared order.
 *
 * @param params - MCP tool call parameters
 * @param tool - Tool definition with argumentNames metadata
 * @param rootName - Name of the root command (stripped from tool name path)
 * @returns Array of strings suitable for Commander.js parseAsync with `{ from: 'user' }`
 */
function buildSyntheticArgv(
  params: McpToolCallParams,
  tool: ToolDefinition,
  rootName: string,
): string[] {
  const argv: string[] = [];

  // Split tool name into command path, removing the root command name
  const parts = params.name.split('_');
  const rootIdx = parts.indexOf(rootName);
  const commandPath = rootIdx >= 0 ? parts.slice(rootIdx + 1) : parts.slice(1);
  argv.push(...commandPath);

  const mcpArgs = params.arguments || {};
  const positionalNames = new Set(tool.argumentNames || []);

  // Process named options (everything not in argumentNames)
  for (const [key, value] of Object.entries(mcpArgs)) {
    if (positionalNames.has(key)) continue;

    const flag = `--${camelToKebab(key)}`;

    if (typeof value === 'boolean') {
      if (value) {
        argv.push(flag);
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        argv.push(flag, String(item));
      }
    } else if (value !== undefined && value !== null) {
      argv.push(flag, String(value));
    }
  }

  // Append positional arguments in their declared order
  for (const argName of tool.argumentNames || []) {
    const value = mcpArgs[argName];
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      argv.push(...value.map(String));
    } else {
      argv.push(String(value));
    }
  }

  return argv;
}

/**
 * Converts a camelCase string to kebab-case for CLI flag generation.
 *
 * @example
 * camelToKebab('happyMode') // 'happy-mode'
 * camelToKebab('logLevel') // 'log-level'
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
