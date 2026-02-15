/**
 * @file MCP server class for cliapp-based applications
 * @description Encapsulates MCP server state and lifecycle, transforming a
 * cliapp command tree into an MCP server over stdio.
 *
 * The caller creates and configures the root context (including logging,
 * transports, and thresholds) the same way they would for CLI mode. The
 * McpServer then:
 * 1. Introspects the command tree to build MCP tool definitions
 * 2. Runs the MCP protocol loop over stdin/stdout
 * 3. For each tool call, creates a child context with sequential reqId
 *
 * @module
 */

import type * as Log from '@epdoc/logger';
import type * as Ctx from '../context.ts';
import { extractToolDefinitions } from './introspect.ts';
import { readMessage, writeMessage } from './protocol.ts';
import { McpResultCollector } from './result.ts';
import type * as Mcp from './types.ts';

/**
 * MCP server that exposes a cliapp command hierarchy as MCP tools over stdio.
 *
 * Each leaf command in the command tree becomes an MCP tool with its options
 * and arguments exposed as the tool's input schema.
 *
 * The caller configures the context the same way as for CLI mode. The server
 * manages the MCP protocol, creating child contexts per tool call.
 *
 * @template TCtx - The application context type
 *
 * @example
 * ```typescript
 * // main.ts — single entry point for both CLI and MCP modes
 * if (Deno.args.includes('--mcp')) {
 *   const ctx = new App.Ctx.RootContext(pkg);
 *   const transport = new Log.Transport.Console.Transport(ctx.logMgr, {
 *     color: false,
 *     useStderr: true,
 *   });
 *   await ctx.logMgr.addTransport(transport);
 *   await ctx.setupLogging({ pkg: 'mcp' });
 *
 *   const server = new CliApp.Mcp.McpServer(ctx, {
 *     createCommand: (childCtx) => new App.Cmd.Root(childCtx),
 *   });
 *   await server.init();
 *   await server.serve();
 * }
 * ```
 */
export class McpServer<TCtx extends Ctx.AbstractBase> {
  #ctx: TCtx;
  #createCommand: Mcp.ServerOptions<TCtx>['createCommand'];
  #tools: Mcp.ToolDefinition[] = [];
  #reqId = 0;

  /**
   * Creates a new MCP server.
   *
   * @param ctx - Fully configured root context (with logging already set up)
   * @param opts - Server options including the command factory
   */
  constructor(ctx: TCtx, opts: Mcp.ServerOptions<TCtx>) {
    this.#ctx = ctx;
    this.#createCommand = opts.createCommand;
  }

  /** The root context for this server. */
  get ctx(): TCtx {
    return this.#ctx;
  }

  /** The tool definitions extracted from the command tree. Available after init(). */
  get tools(): ReadonlyArray<Mcp.ToolDefinition> {
    return this.#tools;
  }

  /** The current request counter. */
  get reqId(): number {
    return this.#reqId;
  }

  /**
   * Initializes the server by introspecting the command tree for tool definitions.
   *
   * Must be called before {@link serve}. Creates a temporary command instance
   * from the root context to extract tool definitions via Commander.js introspection.
   */
  async init(): Promise<this> {
    const introspectCmd = this.#createCommand(this.#ctx);
    await introspectCmd.init();
    this.#tools = extractToolDefinitions(introspectCmd.commander);

    this.#ctx.log.info.text('MCP server initialized').emit();
    this.#ctx.log.info
      .text(`Registered ${this.#tools.length} tool(s): ${this.#tools.map((t) => t.name).join(', ')}`)
      .emit();

    return this;
  }

  /**
   * Starts the MCP protocol loop over stdin/stdout.
   *
   * Reads JSON-RPC requests from stdin, dispatches them, and writes responses
   * to stdout. Blocks until stdin closes, then calls ctx.close().
   */
  async serve(): Promise<void> {
    const reader = Deno.stdin.readable.getReader();
    const readBuffer = { data: new Uint8Array(0) };

    this.#ctx.log.info.text('MCP server listening on stdio').emit();

    while (true) {
      const request = await readMessage(reader, readBuffer);
      if (request === null) {
        this.#ctx.log.info.text('stdin closed, shutting down').emit();
        break;
      }

      const response = await this.#handleRequest(request);
      if (response) {
        await writeMessage(response);
      }
    }

    await this.#ctx.close();
  }

  /**
   * Dispatches an incoming JSON-RPC request to the appropriate handler.
   */
  async #handleRequest(request: Mcp.JsonRpcRequest): Promise<Mcp.JsonRpcResponse | null> {
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
          serverInfo: { name: this.#ctx.pkg.name, version: this.#ctx.pkg.version },
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
        result: { tools: this.#tools },
      };
    }

    if (request.method === 'tools/call') {
      const params = request.params as unknown as Mcp.ToolCallParams;
      const result = await this.#executeToolCall(params);
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
   * 1. Increments the reqId counter
   * 2. Creates a child context from the root with the sequential reqId
   * 3. Attaches an McpResultCollector for explicit result output
   * 4. Constructs synthetic CLI arguments and executes via Commander.js
   * 5. Collects results from the McpResultCollector
   */
  async #executeToolCall(params: Mcp.ToolCallParams): Promise<Mcp.ToolResult> {
    const tool = this.#tools.find((t) => t.name === params.name);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${params.name}` }],
        isError: true,
      };
    }

    this.#reqId++;
    const reqId = String(this.#reqId);

    try {
      // 1. Create a child context with sequential reqId (inherits logMgr + transports)
      const childCtx = new (this.#ctx.constructor as { new (parent: TCtx, params: Log.IGetChildParams): TCtx })(
        this.#ctx,
        { pkg: params.name, reqId },
      );

      // 2. Attach McpResultCollector for explicit response output
      const resultCollector = new McpResultCollector('buffer');
      childCtx.mcpResult = resultCollector;

      this.#ctx.log.debug.text(`Executing tool: ${params.name} (reqId: ${reqId})`).emit();

      // 3. Create and initialize a fresh command tree with the child context
      const rootCmd = this.#createCommand(childCtx);
      await rootCmd.init();
      rootCmd.commander.exitOverride();

      // 4. Construct synthetic argv and execute
      const argv = buildSyntheticArgv(params, tool, this.#ctx.pkg.name);

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

      // 5. Collect results from McpResultCollector
      const content: Mcp.TextContent[] = [];

      if (resultCollector.hasEntries) {
        content.push(...resultCollector.getEntries());
      }

      if (content.length === 0) {
        content.push({ type: 'text', text: 'Command completed successfully.' });
      }

      return { content };
    } catch (err) {
      const error = err as Error;
      this.#ctx.log.error.text(`Tool error: ${params.name}`).err(error).emit();
      return {
        content: [{ type: 'text', text: `Error executing ${params.name}: ${error.message}` }],
        isError: true,
      };
    }
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
  params: Mcp.ToolCallParams,
  tool: Mcp.ToolDefinition,
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
