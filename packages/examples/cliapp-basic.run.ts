#!/usr/bin/env -S deno run -A
import * as Log from '$logger';
import pkg from '../cliapp/deno.json' with { type: 'json' };
// Import both CliApp and the Commander object
import * as CliApp from '$cliapp';
import type { Console } from '$msgbuilder';

// deno run -A examples/basic.ts -D

type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

const logMgr: Log.Mgr<MsgBuilder> = new Log.Mgr<MsgBuilder>().init();
logMgr.threshold = 'info';

const ctx: CliApp.ICtx<MsgBuilder, Logger> = {
  log: logMgr.getLogger<Logger>(),
  logMgr: logMgr,
  dryRun: false,
  close: (): Promise<void> => {
    return Promise.resolve();
  },
};

const run = async (): Promise<void> => {
  const mark = ctx.log.mark();
  const command = new CliApp.Command(pkg).init(ctx).addLogging(ctx).addDryRun();
  const opts = await command.parseOpts();
  CliApp.configureLogging(ctx, opts);
  ctx.log.info.h1('Running').label('test mode:').value(ctx.dryRun).label('log level threshold:').value(
    ctx.log.thresholdName,
  ).emit();
  ctx.log.fatal.h1('Fatal message').emit();
  ctx.log.critical.h1('Critical message').emit();
  ctx.log.error.h1('Error message').emit();
  ctx.log.warn.h1('Warn message').emit();
  ctx.log.info.h1('Info message').emit();
  ctx.log.verbose.h1('Verbose message').emit();
  ctx.log.debug.h1('Debug message').emit();
  ctx.log.trace.h1('Trace message').emit();
  ctx.log.spam.h1('Spam message').emit();
  ctx.log.silly.h1('Silly message').emit();
  ctx.log.info.h1('Final INFO message should show response time here ->').ewt(mark);
  return Promise.resolve();
};

await CliApp.run(ctx, run);
