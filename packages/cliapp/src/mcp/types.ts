/**
 * @file MCP (Model Context Protocol) type definitions
 * @description Types for MCP server integration with cliapp commands
 * @module
 */

import type * as Ctx from '../context.ts';
import type * as Cmd from '../cmd/mod.ts';

/**
 * JSON Schema property definition used in MCP tool inputSchema.
 */
export type JsonSchemaProperty = {
  type: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  items?: { type: string };
};

/**
 * JSON Schema object definition for MCP tool input parameters.
 */
export interface JsonSchema {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

/**
 * MCP tool definition returned by the tools/list handler.
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  /**
   * Internal metadata tracking which inputSchema properties correspond to
   * positional arguments (vs named options). Used by the serve layer to
   * reconstruct synthetic CLI argv correctly.
   * @internal
   */
  argumentNames?: string[];
}

/**
 * Configuration for launching a cliapp-based MCP server.
 *
 * @template TCtx - The application context type
 *
 * @example
 * ```typescript
 * await CliApp.Mcp.serve({
 *   pkg,
 *   createContext: () => new App.Ctx.RootContext(pkg),
 *   createCommand: (ctx) => new App.Cmd.Root(ctx),
 * });
 * ```
 */
export interface McpServeOptions<TCtx extends Ctx.AbstractBase = Ctx.AbstractBase> {
  /** Package metadata providing server name and version. */
  pkg: { name: string; version: string };
  /** Factory to create a fresh context for each tool call. Do not call setupLogging. */
  createContext: () => TCtx;
  /** Factory to create a fresh root command from a context. Do not call init(). */
  // deno-lint-ignore no-explicit-any
  createCommand: (ctx: TCtx) => Cmd.AbstractBase<any, TCtx>;
}

/**
 * JSON-RPC 2.0 request message.
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
}

/**
 * JSON-RPC 2.0 response message.
 */
export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

/**
 * Parameters for the tools/call MCP request.
 */
export interface McpToolCallParams {
  name: string;
  arguments?: Record<string, unknown>;
}

/**
 * Content item in an MCP tool call result.
 */
export interface McpTextContent {
  type: 'text';
  text: string;
}

/**
 * Result returned from an MCP tool call.
 */
export interface McpToolResult {
  content: McpTextContent[];
  isError?: boolean;
}
