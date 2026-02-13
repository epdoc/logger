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
export { McpResultCollector as ResultCollector } from './result.ts';
export { McpServer as Server } from './server.ts';
export type * from './types.ts';
