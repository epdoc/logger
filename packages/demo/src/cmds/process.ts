import type * as CliApp from '@epdoc/cliapp';
import * as App from '../app/mod.ts';
import * as Ctx from '../context.ts';

export class QueryCommand extends Ctx.BaseQueryCmdClass {
  override defineMetadata() {
    this.description = 'Query Mastodon instances';
    this.name = 'query';
    // this.aliases = 'proc';
  }

  override createContext(parent: Ctx.RootContext): Ctx.QueryContext {
    const result = new Ctx.QueryContext(parent, { pkg: 'query' });
    this.log.info.section('QueryCommand createContext').emit();
    this.log.info.demo(result).emit();
    this.log.info.h2('Returns a new QueryContext for the QueryCommand').emit();
    this.log.info.section().emit();
    return result;
  }

  override hydrateContext(opts: Ctx.QueryCmdOpts, args: CliApp.CmdArgs): void {
    this.log.info.section('QueryCommand hydrateContext').emit();
    this.ctx.more = opts.more ? true : false;
    this.ctx.apis = args.map((server) => new App.Api(server));
    this.log.info.demo(this.ctx).emit();
    this.log.info.h2('We could also have hydrated the context in the execute method.').emit();
    this.log.info.section().emit();
  }

  override defineOptions(): void {
    this.log.info.section('QueryCommand defineOptions').emit();
    this.option('--more', 'Show more info').emit();
    this.argument('<servers...>', 'Servers to query').choices(App.demoInstances).emit();
    this.log.info.h2('We added the query options and arguments.').emit();
    this.log.info.section().emit();
  }

  override async execute(_opts: Ctx.QueryCmdOpts, _args: string[]): Promise<void> {
    this.log.info.section('QueryCommand Execution').emit();
    this.log.info.demo(this.ctx).emit();
    for (const api of this.ctx.apis) {
      this.log.info.text(`Processing API at ${api}`).emit();
      this.log.indent();
      const meta = await api.getMeta();
      this.log.info.opts(meta, 'API Metadata').emit();
      this.log.outdent();
    }
    this.log.info.section().emit();
  }
}
