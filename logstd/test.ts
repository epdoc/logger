import { Logger } from './logger.ts';

Deno.test('logger', () => {
  const log = new Logger().setThreshold('TRACE');
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
