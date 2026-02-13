/**
 * @file MCP server entry point for the demo application
 * @description Launches the same CLI commands as main.ts, but exposed as MCP
 * tools over the Model Context Protocol. This is the alternate entry point
 * for when the application is used as an MCP server by AI assistants.
 *
 * @example Register as an MCP server in Claude Code:
 * ```bash
 * claude mcp add --transport stdio demo -- deno run -A mcp-main.ts
 * ```
 */

import * as CliApp from '@epdoc/cliapp';
import pkg from './deno.json' with { type: 'json' };
import * as App from './src/mod.ts';

if (import.meta.main) {
  await CliApp.Mcp.serve({
    pkg,
    createContext: () => new App.Ctx.RootContext(pkg),
    createCommand: (ctx) => new App.Cmd.Root(ctx),
  });
}
