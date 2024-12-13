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
Deno.test('std logger with elapsed and level and pkg', () => {
  const log = new Logger()
    .setThreshold('TRACE')
    .show({ timestamp: 'elapsed', level: true, package: true })
    .setPackage('mypkg');
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
Deno.test('std logger with elapsed and level and pkg and mark', () => {
  const log = new Logger()
    .setThreshold('TRACE')
    .show({ timestamp: 'elapsed', level: true, package: true })
    .setPackage('mypkg');
  log.mark('x1').mark('x2');
  log.info.h1('Level').value('info').ewt('x1', true);
  log.verbose.h1('Level').value('verbose').ewt('x2');
  log.debug.h1('Level').value('debug').ewt('x1', true);
  log.trace.h1('Level').value('trace').ewt('x1');
});
