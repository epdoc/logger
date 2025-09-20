import type * as MsgBuilder from '$msgbuilder';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

Deno.test('logger', () => {
  const logMgr = new Log.Mgr<M>().init(Log.Cli.factoryMethods);
  logMgr.threshold = 'silly';
  const log: Log.Cli.Logger<M> = logMgr.getLogger<Log.Cli.Logger<M>>();
  log.info.h1('header').emit('info level');
  log.silly.h1('header').emit('silly level');
  log.error.err(new Error('error')).value('error level').emit('test');
  log.verbose.err(new Error('error')).value('verbose level').emit('test');
});
