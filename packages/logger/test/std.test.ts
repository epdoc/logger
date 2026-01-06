import type * as MsgBuilder from '@epdoc/msgbuilder';
import { describe, it } from '@std/testing/bdd';
import * as Log from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;
type L = Log.Std.Logger<M>;

const logMgr = new Log.Mgr<M>().initLevels();
logMgr.threshold = 'spam';

describe('Std Logger', () => {
  it('should log basic messages', async () => {
    const log = await logMgr.getLogger<L>();
    log.info.h1('test:').value('std logger').emit();
    log.info.h1('Level').value('info').emit('test');
    log.error.h1('Level').value('error').error('error').emit('test');
    log.warn.h1('Level').value('warn').warn('warn').emit('test');
    log.verbose.h1('Level').value('verbose').emit('test');
    log.debug.h1('Level').value('debug').emit('test');
    log.trace.h1('Level').value('trace').emit('emit');
    log.spam.h1('Level').value('spam').emit('emit');
  });

  it('should log with level display', async () => {
    logMgr.show = { level: true };
    const log = await logMgr.getLogger<L>();
    log.info.h1('test:').value('std logger').emit();
    log.info.h1('Level').value('info').emit('test');
    log.error.h1('Level').value('error').error('error').emit('test');
    log.verbose.h1('Level').value('verbose').emit('test');
    log.debug.h1('Level').value('debug').emit('test');
    log.trace.h1('Level').value('trace').emit('emit');
    log.spam.h1('Level').value('spam').emit('emit');
  });

  it('should log with UTC timestamp', async () => {
    logMgr.show = { timestamp: 'utc' };
    const log = await logMgr.getLogger<L>();
    log.info.h1('test:').value('std logger').emit();
    log.info.h1('Level').value('info').emit('test');
    log.error.h1('Level').value('error').error('error').emit('test');
    log.verbose.h1('Level').value('verbose').emit('test');
    log.debug.h1('Level').value('debug').emit('test');
    log.trace.h1('Level').value('trace').emit('emit');
    log.spam.h1('Level').value('spam').emit('emit');
  });

  it('should log with local timestamp', async () => {
    logMgr.show = { timestamp: 'local' };
    const log = await logMgr.getLogger<L>();
    log.info.h1('test:').value('std logger with local').emit();
    log.info.h1('Level').value('info').emit('test');
    log.error.h1('Level').value('error').error('error').emit('test');
    log.verbose.h1('Level').value('verbose').emit('test');
    log.debug.h1('Level').value('debug').emit('test');
    log.trace.h1('Level').value('trace').emit('emit');
    log.spam.h1('Level').value('spam').emit('emit');
  });

  it('should log with elapsed timestamp', async () => {
    logMgr.show = { timestamp: 'elapsed' };
    const log = await logMgr.getLogger<L>();
    log.info.h1('test:').value('std logger with elapsed').emit();
    log.info.h1('Level').value('info').emit('test');
    log.error.h1('Level').value('error').error('error').emit('test');
    log.verbose.h1('Level').value('verbose').emit('test');
    log.debug.h1('Level').value('debug').emit('test');
    log.trace.h1('Level').value('trace').emit('emit');
    log.spam.h1('Level').value('spam').emit('emit');
  });

  it('should log with elapsed and level display', async () => {
    logMgr.show = { timestamp: 'utc', level: true };
    const log = await logMgr.getLogger<L>();
    log.info.h1('std logger with elapsed and level').emit();
    log.error.h2('Level').value('error').error('error').emit('test');
    log.warn.h2('Level').value('warn').emit('emit');
    log.info.h2('Level').value('info').emit('test');
    log.verbose.h2('Level').value('verbose').emit('test');
    log.debug.h2('Level').value('debug').emit('test');
    log.trace.h2('Level').value('trace').emit('emit');
    log.spam.h2('Level').value('spam').emit('emit');
  });

  it('should respect threshold settings', async () => {
    logMgr.show = { timestamp: 'utc', level: true };
    const log = await logMgr.getLogger<L>();
    log.info.h1('test:').value('std logger with elapsed and level and threshold').emit();
    logMgr.threshold = 'info';
    log.info.h1('Level').value('info').emit('test');
    log.error.h1('Level').value('error').error('error').emit('test');
    log.verbose.h1('Level').value('verbose').emit('test');
    log.debug.h1('Level').value('debug').emit('test');
    log.trace.h1('Level').value('trace').emit('emit');
    log.spam.h1('Level').value('spam').emit('emit');
  });

  it('should display package information', async () => {
    logMgr.show = { timestamp: 'utc', level: true, pkg: true };
    const log = await logMgr.getLogger<L>();
    log.info.h1('test:').value('std logger with elapsed and level and pkg').emit();
    log.pkgs.push('mypkg');
    log.info.h1('Level').value('info').emit('test');
    log.error.h1('Level').value('error').error('error').emit('test');
    log.verbose.h1('Level').value('verbose').emit('test');
    log.debug.h1('Level').value('debug').emit('test');
    log.trace.h1('Level').value('trace').emit('emit');
    log.spam.h1('Level').value('spam').emit('emit');
  });

  it('should support performance marking', async () => {
    logMgr.show = { timestamp: 'utc', level: true, pkg: true };
    const log = await logMgr.getLogger<L>();
    log.pkgs.push('mypkg');
    const m1 = log.mark();
    const m2 = log.mark();
    log.info.h1('test:').value('std logger with elapsed and level and pkg and mark').emit();
    log.info.h1('Level').value('info').ewt(m1, true);
    log.verbose.h1('Level').value('verbose').ewt(m2);
    log.debug.h1('Level').value('debug').ewt(m1, true);
    log.trace.h1('Level').value('trace').ewt(m1, true);
    log.spam.h1('Level').value('spam').ewt(m1);
  });
});
