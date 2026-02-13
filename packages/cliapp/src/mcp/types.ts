/**
 * @file MCP (Model Context Protocol) type definitions
 * @description Types for MCP server integration with cliapp commands
 * @module
 */

import type * as Cmd from '../cmd/mod.ts';
import type * as Ctx from '../context.ts';

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
 * The context is created and configured by the caller (same as CLI mode),
 * giving full control over logging setup, transports, and thresholds.
 * The serve function creates child contexts from this root for each tool call.
 *
 * @template TCtx - The application context type
 *
 * @example
 * ```typescript
 * const ctx = new App.Ctx.RootContext(pkg);
 * await ctx.setupLogging({ pkg: 'mcp' });
 *
 * await CliApp.Mcp.serve(ctx, {
 *   createCommand: (childCtx) => new App.Cmd.Root(childCtx),
 * });
 * ```
 */
export interface ServerOptions<TCtx extends Ctx.AbstractBase = Ctx.AbstractBase> {
  /** Factory to create a fresh root command for each tool call. Do not call init(). */
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
export interface ToolCallParams {
  name: string;
  arguments?: Record<string, unknown>;
}

/**
 * Content item in an MCP tool call result.
 */
export interface TextContent {
  type: 'text';
  text: string;
}

/**
 * Result returned from an MCP tool call.
 */
export interface ToolResult {
  content: TextContent[];
  isError?: boolean;
}
