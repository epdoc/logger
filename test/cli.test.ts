import { CliLogger, LogMgr } from '../mod.ts';

Deno.test('logger', () => {
  const logMgr = new LogMgr('cli').setThreshold('silly');
  const log: CliLogger = logMgr.getLogger() as CliLogger;
  log.info.h1('header').emit('info level');
  log.silly.h1('header').emit('silly level');
  log.error.error('error').value('error level').emit('test');
  log.verbose.error('error').value('verbose level').emit('test');
});
