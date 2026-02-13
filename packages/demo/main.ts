import * as CliApp from '@epdoc/cliapp';
import pkg from './deno.json' with { type: 'json' };
import * as App from './src/mod.ts';

if (import.meta.main) {
  if (Deno.args.includes('--mcp')) {
    // MCP server mode — expose CLI commands as MCP tools over stdio
    const ctx = new App.Ctx.RootContext(pkg);
    await ctx.setupLogging({ pkg: 'mcp' });
    await CliApp.Mcp.serve(ctx, {
      createCommand: (childCtx) => new App.Cmd.Root(childCtx),
    });
  } else {
    // Standard CLI mode
    const ctx = new App.Ctx.RootContext(pkg);
    await ctx.setupLogging({ pkg: 'app' });
    const rootCmd = new App.Cmd.Root(ctx);
    await CliApp.run(ctx, rootCmd);
  }
}
