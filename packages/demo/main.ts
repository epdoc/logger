import * as CliApp from '@epdoc/cliapp';
import * as Log from '@epdoc/logger';
import pkg from './deno.json' with { type: 'json' };
import * as App from './src/mod.ts';

if (import.meta.main) {
  // Preparse Deno.args before commanderjs is involved
  if (Deno.args.includes('--mcp')) {
    // MCP server mode — expose CLI commands as MCP tools over stdio. Redirects console log messages
    // to stderr to avoid interfering with the MCP JSON-RPC stream on stdout.
    const ctx = new App.Ctx.RootContext(pkg);
    const consoleTransport = new Log.Transport.Console.Transport(ctx.logMgr, { color: false, useStderr: true });
    await ctx.logMgr.addTransport(consoleTransport);
    await ctx.setupLogging({ pkg: 'mcp' });

    const opts: CliApp.Mcp.ServerOptions<typeof ctx> = {
      createCommand: (childCtx) => new App.Cmd.Root(childCtx),
    };
    const server = new CliApp.Mcp.Server(ctx, opts);
    await server.init();
    await server.serve();
  } else {
    // Standard CLI mode
    const ctx = new App.Ctx.RootContext(pkg);
    await ctx.setupLogging({ pkg: 'app' });
    const rootCmd = new App.Cmd.Root(ctx);
    await CliApp.run(ctx, rootCmd);
  }
}
