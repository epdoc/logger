import { Log } from '../mod.ts';

type M = Log.MsgBuilder.Console;

Deno.test('logger', () => {
  const logMgr = new Log.Mgr<M>(Log.cli.createLogLevels).logger(Log.cli.getLogger<M>);
  logMgr.setThreshold('silly');
  const log: Log.cli.Logger<M> = logMgr.getLogger() as Log.cli.Logger<M>;
  log.info.h1('header').emit('info level');
  log.silly.h1('header').emit('silly level');
  log.error.error('error').value('error level').emit('test');
  log.verbose.error('error').value('verbose level').emit('test');
});
