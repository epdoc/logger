/**
 * @file MCP (Model Context Protocol) server integration for cliapp
 * @description Exports for exposing cliapp commands as MCP tools.
 *
 * This module enables any cliapp-based CLI application to be served as an
 * MCP server, allowing AI assistants to invoke CLI commands as tools.
 *
 * @module
 */

export { extractToolDefinitions } from './introspect.ts';
export { McpResultCollector } from './result.ts';
export { serve } from './serve.ts';
export type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonSchema,
  JsonSchemaProperty,
  McpServeOptions,
  McpTextContent,
  McpToolCallParams,
  McpToolResult,
  ToolDefinition,
} from './types.ts';
