import { Log } from '../mod.ts';

const logMgr = new Log.Mgr('std').setThreshold('spam');

Deno.test('std logger', () => {
  const log = logMgr.getLogger() as Log.std.Logger;
  log.info.h1('test:').value('std logger').emit();
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.warn.h1('Level').value('warn').warn('warn').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
  log.spam.h1('Level').value('spam').emit('emit');
});
Deno.test('std logger with level', () => {
  logMgr.setShow({ level: true });
  const log = logMgr.getLogger('std') as Log.std.Logger;
  log.info.h1('test:').value('std logger').emit();
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
  log.spam.h1('Level').value('spam').emit('emit');
});
Deno.test('std logger with utc', () => {
  logMgr.setShow({ timestamp: 'utc' });
  const log = logMgr.getLogger('std') as Log.std.Logger;
  log.info.h1('test:').value('std logger').emit();
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
  log.spam.h1('Level').value('spam').emit('emit');
});
Deno.test('std logger with local', () => {
  logMgr.setShow({ timestamp: 'local' });
  const log = logMgr.getLogger('std') as Log.std.Logger;
  log.info.h1('test:').value('std logger with local').emit();
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
  log.spam.h1('Level').value('spam').emit('emit');
});
Deno.test('std logger with elapsed', () => {
  logMgr.setShow({ timestamp: 'elapsed' });
  const log = logMgr.getLogger('std') as Log.std.Logger;
  log.info.h1('test:').value('std logger with elapsed').emit();
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
  log.spam.h1('Level').value('spam').emit('emit');
});
Deno.test('std logger with elapsed and level', () => {
  logMgr.setShow({ timestamp: 'utc', level: true });
  const log = logMgr.getLogger('std') as Log.std.Logger;
  log.info.h1('std logger with elapsed and level').emit();
  log.error.h2('Level').value('error').error('error').emit('test');
  log.warn.h2('Level').value('warn').emit('emit');
  log.info.h2('Level').value('info').emit('test');
  log.verbose.h2('Level').value('verbose').emit('test');
  log.debug.h2('Level').value('debug').emit('test');
  log.trace.h2('Level').value('trace').emit('emit');
  log.spam.h2('Level').value('spam').emit('emit');
});
Deno.test('std logger with elapsed and level and threshold', () => {
  logMgr.setShow({ timestamp: 'utc', level: true });
  const log = logMgr.getLogger('std') as Log.std.Logger;
  log.info.h1('test:').value('std logger with elapsed and level and threshold').emit();
  logMgr.setThreshold('info');
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
  log.spam.h1('Level').value('spam').emit('emit');
});
Deno.test('std logger with elapsed and level and pkg', () => {
  logMgr.setShow({ timestamp: 'utc', level: true, package: true });
  const log = logMgr.getLogger('std') as Log.std.Logger;
  log.info.h1('test:').value('std logger with elapsed and level and pkg').emit();
  log.setPackage('mypkg');
  log.info.h1('Level').value('info').emit('test');
  log.error.h1('Level').value('error').error('error').emit('test');
  log.verbose.h1('Level').value('verbose').emit('test');
  log.debug.h1('Level').value('debug').emit('test');
  log.trace.h1('Level').value('trace').emit('emit');
  log.spam.h1('Level').value('spam').emit('emit');
});
Deno.test('std logger with elapsed and level and pkg and mark', () => {
  logMgr.setShow({ timestamp: 'utc', level: true, package: true });
  const log = logMgr.getLogger('std') as Log.std.Logger;
  log.setPackage('mypkg');
  const m1 = log.mark();
  const m2 = log.mark();
  log.info.h1('test:').value('std logger with elapsed and level and pkg and mark').emit();
  log.info.h1('Level').value('info').ewt(m1, true);
  log.verbose.h1('Level').value('verbose').ewt(m2);
  log.debug.h1('Level').value('debug').ewt(m1, true);
  log.trace.h1('Level').value('trace').ewt(m1, true);
  log.spam.h1('Level').value('spam').ewt(m1);
});
