/**
 * @file MCP result collector for command output
 * @description Provides a lightweight mechanism for commands to emit structured
 * output intended for the MCP tool response, separate from diagnostic logging.
 *
 * In CLI mode, results are written to stdout immediately.
 * In MCP mode, results are buffered and returned as the tool call response.
 * @module
 */

import type * as Mcp from './types.ts';

/**
 * Collects output intended for the MCP tool response.
 *
 * This separates "response data" from "diagnostic logging." Commands use this
 * to emit the actual results that should be returned to the MCP caller, while
 * regular logging remains for diagnostics.
 *
 * @example
 * ```typescript
 * // In a command's execute method:
 * if (this.ctx.mcpResult) {
 *   this.ctx.mcpResult.text(`Found ${count} devices`);
 *   this.ctx.mcpResult.data({ devices: deviceList });
 * }
 * ```
 */
export class McpResultCollector {
  #entries: Mcp.TextContent[] = [];
  #mode: 'buffer' | 'stdout';

  /**
   * Creates a new result collector.
   *
   * @param mode - 'buffer' to collect results in memory (MCP mode),
   *               'stdout' to write results immediately (CLI mode)
   */
  constructor(mode: 'buffer' | 'stdout' = 'buffer') {
    this.#mode = mode;
  }

  /**
   * Emit a text result.
   *
   * @param value - Text content to include in the response
   */
  text(value: string): this {
    if (this.#mode === 'stdout') {
      console.log(value);
    } else {
      this.#entries.push({ type: 'text', text: value });
    }
    return this;
  }

  /**
   * Emit structured data as JSON.
   *
   * @param value - Data to serialize and include in the response
   * @param indent - JSON indentation (default: 2)
   */
  data(value: unknown, indent = 2): this {
    const json = JSON.stringify(value, null, indent);
    if (this.#mode === 'stdout') {
      console.log(json);
    } else {
      this.#entries.push({ type: 'text', text: json });
    }
    return this;
  }

  /**
   * Retrieve all collected result entries (MCP mode only).
   *
   * @returns Array of MCP text content items
   */
  getEntries(): Mcp.TextContent[] {
    return [...this.#entries];
  }

  /**
   * Clear all collected entries.
   */
  clear(): void {
    this.#entries = [];
  }

  /**
   * Check whether any results have been collected.
   */
  get hasEntries(): boolean {
    return this.#entries.length > 0;
  }
}
