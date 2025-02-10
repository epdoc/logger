import { Log } from '../mod.ts';

Deno.test('logger', () => {
  const logMgr = new Log.Mgr('cli').setThreshold('silly');
  const log: Log.cli.Logger = logMgr.getLogger() as Log.cli.Logger;
  log.info.h1('header').emit('info level');
  log.silly.h1('header').emit('silly level');
  log.error.error('error').value('error level').emit('test');
  log.verbose.error('error').value('verbose level').emit('test');
});
