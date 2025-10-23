#!/usr/bin/env -S deno run -A
import * as Log from '$logger';
import pkg from '../cliapp/deno.json' with { type: 'json' };
// Import both CliApp and the Commander object
import * as CliApp from '$cliapp';
import type { Console } from '$msgbuilder';

// deno run -A examples/basic.ts -t

type M = Console.Builder;
type L = Log.Std.Logger<M>;

const logMgr: Log.Mgr<M> = new Log.Mgr<M>().init();
logMgr.threshold = 'info';

// The basic context, which you can extend as needed for your own app
const ctx: CliApp.ICtx<M, L> = {
  log: logMgr.getLogger<L>(),
  logMgr: logMgr,
  dryRun: false,
  close: (): Promise<void> => {
    return Promise.resolve();
  },
};

// We're adding a purge option, for demonstration purposes
type CliOpts = CliApp.Opts & {
  purge?: boolean;
  choose?: 'aa' | 'bb' | 'cc';
  reqId?: string;
  pkg?: string;
  sid?: string;
};

class Cli {
  async run(ctx: CliApp.ICtx<M, L>): Promise<void> {
    const cpkg = Object.assign(pkg, { name: 'purge', description: 'CLI demo that does nothing' });
    const command = new CliApp.Command(cpkg);
    command.init(ctx);

    // Add a custom option using the exported Commander.Option
    const choiceOption = new CliApp.Commander.Option('-c --choose <value>', 'Choose one').choices(['aa', 'bb', 'cc'])
      .default(
        'aa',
      );
    const purgeOption = new CliApp.Commander.Option('-p --purge', 'Purge old data').default(false);
    const reqIdOption = new CliApp.Commander.Option('-r --reqId <string>', 'Request ID');
    const sidOption = new CliApp.Commander.Option('--sid <string>', 'SID');
    const pkgOption = new CliApp.Commander.Option('--pkg <string>', 'Package');
    command.addOption(choiceOption);
    command.addOption(purgeOption);
    command.addOption(reqIdOption);
    command.addOption(sidOption);
    command.addOption(pkgOption);

    command.addLogging(ctx);

    const opts = await command.parseOpts() as CliOpts;
    if (opts.reqId) ctx.log.reqId = opts.reqId;
    if (opts.pkg) ctx.log.pkgs.push(opts.pkg);
    if (opts.sid) ctx.log.sid = opts.sid;

    CliApp.configureLogging(ctx, opts);
    ctx.log.info.h1('Running').label('Purge:').value(opts.purge)
      .label('Choose:').value(opts.choose)
      .label('Log threshold:').value(ctx.log.thresholdName)
      .label('ReqId:').value(opts.reqId)
      .label('SID:').value(opts.sid)
      .label('pkg:').value(opts.pkg)
      .emit();
    ctx.log.fatal.h1('Fatal message').emit();
    const mark = ctx.log.mark();
    ctx.log.critical.h1('Critical message').text('Set mark').emit();
    ctx.log.error.h1('Error message').emit();
    ctx.log.warn.h1('Warn message').emit();
    ctx.log.info.h1('Info message').emit();
    ctx.log.verbose.h1('Verbose message').emit();
    ctx.log.debug.h1('Debug message').emit();
    ctx.log.trace.h1('Trace message').emit();
    ctx.log.spam.h1('Spam message').emit();
    ctx.log.silly.h1('Silly message').text('Show mark').ewt(mark);
    return Promise.resolve();
  }
}

if (import.meta.main) {
  const app = new Cli();

  // Our utility run method
  await CliApp.run(ctx, () => app.run(ctx));
}
