import { LogMgr, StdLogger } from '../mod.ts';

const logMgr = new LogMgr('std').setThreshold('trace');

Deno.test('std logger', () => {
  const log = logMgr.getLogger() as StdLogger;
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.warn.h1('Level').value('warn').warn('warn').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
Deno.test('std logger with level', () => {
  logMgr.setShow({ level: true });
  const log = logMgr.getLogger('std') as StdLogger;
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
Deno.test('std logger with utc', () => {
  logMgr.setShow({ timestamp: 'utc' });
  const log = logMgr.getLogger('std') as StdLogger;
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
Deno.test('std logger with local', () => {
  logMgr.setShow({ timestamp: 'local' });
  const log = logMgr.getLogger('std') as StdLogger;
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
Deno.test('std logger with elapsed', () => {
  logMgr.setShow({ timestamp: 'elapsed' });
  const log = logMgr.getLogger('std') as StdLogger;
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
Deno.test('std logger with elapsed and level', () => {
  logMgr.setShow({ timestamp: 'utc', level: true });
  const log = logMgr.getLogger('std') as StdLogger;
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
Deno.test('std logger with elapsed and level and pkg', () => {
  logMgr.setShow({ timestamp: 'utc', level: true, package: true });
  const log = logMgr.getLogger('std') as StdLogger;
  log.setPackage('mypkg');
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
});
Deno.test('std logger with elapsed and level and pkg and mark', () => {
  logMgr.setShow({ timestamp: 'utc', level: true, package: true });
  const log = logMgr.getLogger('std') as StdLogger;
  log.setPackage('mypkg');
  log.mark('x1').mark('x2');
  log.info.h1('Level').value('info').ewt('x1', true);
  log.verbose.h1('Level').value('verbose').ewt('x2');
  log.debug.h1('Level').value('debug').ewt('x1', true);
  log.trace.h1('Level').value('trace').ewt('x1');
});
