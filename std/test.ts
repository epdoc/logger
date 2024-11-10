import { Logger } from './logger.ts';

Deno.test('std logger', () => {
  const log = new Logger().setThreshold('TRACE');
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
Deno.test('std logger with level', () => {
  const log = new Logger().setThreshold('TRACE').show({ level: true });
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
Deno.test('std logger with utc', () => {
  const log = new Logger().setThreshold('TRACE').show({ timestamp: 'utc' });
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
Deno.test('std logger with local', () => {
  const log = new Logger().setThreshold('TRACE').show({ timestamp: 'local' });
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
Deno.test('std logger with elapsed', () => {
  const log = new Logger().setThreshold('TRACE').show({ timestamp: 'elapsed' });
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
Deno.test('std logger with elapsed and level', () => {
  const log = new Logger().setThreshold('TRACE').show({ timestamp: 'elapsed', level: true });
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
