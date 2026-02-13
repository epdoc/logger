/**
 * @file MCP server entry point for cliapp-based applications
 * @description Launches a cliapp command tree as an MCP server, allowing
 * CLI commands to be invoked as MCP tools by AI assistants.
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
 * The server handles the full MCP lifecycle:
 * 1. Responds to `initialize` with server capabilities
 * 2. Responds to `tools/list` with tool definitions derived from the command tree
 * 3. Responds to `tools/call` by executing the corresponding command with a
 *    fresh context, capturing log output via {@link Log.Transport.Buffer.Transport}
 *
 * @param opts - Configuration for the MCP server
 * @param opts.pkg - Package metadata (name, version) for the MCP server info
 * @param opts.createContext - Factory to create a fresh context per tool call
 * @param opts.createCommand - Factory to create a fresh root command per tool call
 *
 * @example
 * ```typescript
 * // mcp-main.ts
 * import * as CliApp from '@epdoc/cliapp';
 * import pkg from './deno.json' with { type: 'json' };
 * import * as App from './src/mod.ts';
 *
 * if (import.meta.main) {
 *   await CliApp.Mcp.serve({
 *     pkg,
 *     createContext: () => new App.Ctx.RootContext(pkg),
 *     createCommand: (ctx) => new App.Cmd.Root(ctx),
 *   });
 * }
 * ```
 */
export async function serve<TCtx extends Ctx.AbstractBase>(
  opts: McpServeOptions<TCtx>,
): Promise<void> {
  // 1. Create a temporary instance to introspect the command tree for tool definitions
  const introspectCtx = opts.createContext();
  await introspectCtx.setupLogging('warn');
  const introspectCmd = opts.createCommand(introspectCtx);
  await introspectCmd.init();
  const tools = extractToolDefinitions(introspectCmd.commander);
  await introspectCtx.close();

  // Log server startup info to stderr (stdout is reserved for MCP protocol)
  console.error(`[MCP] Server "${opts.pkg.name}" v${opts.pkg.version} starting`);
  console.error(`[MCP] Registered ${tools.length} tool(s): ${tools.map((t) => t.name).join(', ')}`);

  // 2. Start the MCP protocol loop
  const reader = Deno.stdin.readable.getReader();
  const buffer = { data: new Uint8Array(0) };

  while (true) {
    const request = await readMessage(reader, buffer);
    if (request === null) {
      console.error('[MCP] stdin closed, shutting down');
      break;
    }

    const response = await handleRequest(request, opts, tools);
    if (response) {
      await writeMessage(response);
    }
  }
}

/**
 * Dispatches an incoming JSON-RPC request to the appropriate handler.
 *
 * @param request - The incoming JSON-RPC request
 * @param opts - Server configuration with context/command factories
 * @param tools - Pre-computed tool definitions from command introspection
 * @returns JSON-RPC response, or null for notifications
 */
async function handleRequest<TCtx extends Ctx.AbstractBase>(
  request: JsonRpcRequest,
  opts: McpServeOptions<TCtx>,
  tools: ToolDefinition[],
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
        serverInfo: { name: opts.pkg.name, version: opts.pkg.version },
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
    const result = await executeToolCall(params, opts, tools);
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
 * Executes an MCP tool call by mapping it to the corresponding cliapp command.
 *
 * For each tool call:
 * 1. Creates a fresh context with a unique reqId
 * 2. Configures logging with a BufferTransport to capture output
 * 3. Constructs synthetic CLI arguments from the MCP parameters
 * 4. Initializes and executes the command via Commander.js parseAsync
 * 5. Collects the captured log output as the tool result
 *
 * @param params - The MCP tool call parameters (tool name + arguments)
 * @param opts - Server configuration with context/command factories
 * @param tools - Tool definitions for validation
 * @returns MCP tool result with captured output
 */
async function executeToolCall<TCtx extends Ctx.AbstractBase>(
  params: McpToolCallParams,
  opts: McpServeOptions<TCtx>,
  tools: ToolDefinition[],
): Promise<McpToolResult> {
  const tool = tools.find((t) => t.name === params.name);
  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${params.name}` }],
      isError: true,
    };
  }

  const reqId = crypto.randomUUID().slice(0, 8);
  console.error(`[MCP] Executing tool: ${params.name} (reqId: ${reqId})`);

  try {
    // 1. Create fresh context and configure logging with BufferTransport
    const ctx = opts.createContext();
    const bufferTransport = new Log.Transport.Buffer.Transport(ctx.logMgr, { maxEntries: 10000 });
    await ctx.logMgr.transportMgr.add(bufferTransport);
    await ctx.setupLogging({ pkg: 'mcp', reqId });

    // 2. Attach an McpResultCollector so commands can emit structured results
    const resultCollector = new McpResultCollector('buffer');
    ctx.mcpResult = resultCollector;

    // 3. Create and initialize a fresh command tree
    const rootCmd = opts.createCommand(ctx);
    await rootCmd.init();

    // 4. Prevent Commander.js from calling process.exit
    rootCmd.commander.exitOverride();

    // 5. Construct synthetic argv from tool name and MCP arguments
    const argv = buildSyntheticArgv(params, tool, opts.pkg.name);

    // 6. Execute via Commander.js
    try {
      await rootCmd.commander.parseAsync(argv, { from: 'user' });
    } catch (err) {
      // Commander throws on --help or exitOverride; capture as error
      const error = err as Error & { exitCode?: number };
      if (error.exitCode !== undefined && error.exitCode === 0) {
        // Help output or version - not an error
      } else {
        throw err;
      }
    }

    // 7. Collect results — prefer explicit mcpResult content over log output
    const content: McpTextContent[] = [];

    if (resultCollector.hasEntries) {
      // Commands explicitly provided MCP result content
      content.push(...resultCollector.getEntries());
    } else {
      // Fall back to captured log output (for commands not yet MCP-aware)
      const logText = bufferTransport.getMessages().filter((m) => m.length > 0).join('\n');
      if (logText.length > 0) {
        content.push({ type: 'text', text: logText });
      }

      // Include structured data from log entries if present
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

    // Ensure we always return some content
    if (content.length === 0) {
      content.push({ type: 'text', text: 'Command completed successfully.' });
    }

    // 8. Clean up
    await ctx.close();

    return { content };
  } catch (err) {
    const error = err as Error;
    console.error(`[MCP] Tool error: ${params.name} - ${error.message}`);
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
