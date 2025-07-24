import { Log } from '../mod.ts';

type M = Log.MsgBuilder.Console;

Deno.test('logger', () => {
  const logMgr = new Log.Mgr<M>(Log.cli.createLogLevels);
  logMgr.loggerFactory = Log.cli.createLogger;
  logMgr.threshold = 'silly';
  const log: Log.cli.Logger<M> = logMgr.getLogger<Log.cli.Logger<M>>();
  log.info.h1('header').emit('info level');
  log.silly.h1('header').emit('silly level');
  log.error.err(new Error('error')).value('error level').emit('test');
  log.verbose.err(new Error('error')).value('verbose level').emit('test');
});
