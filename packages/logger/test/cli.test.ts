import type * as MsgBuilder from '@epdoc/msgbuilder';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

Deno.test('logger', async () => {
  const logMgr = new Log.Mgr<M>().initLevels(Log.Cli.factoryMethods);
  logMgr.threshold = 'silly';
  const log: Log.Cli.Logger<M> = await logMgr.getLogger<Log.Cli.Logger<M>>();
  log.info.h1('header').emit('info level');
  log.silly.h1('header').emit('silly level');
  log.error.err(new Error('error')).value('error level').emit('test');
  log.verbose.err(new Error('error')).value('verbose level').emit('test');
});
