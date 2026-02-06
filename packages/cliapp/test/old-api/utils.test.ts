import * as Log from '@epdoc/logger';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { assertEquals, assertThrows } from '@std/assert';
import { beforeEach, describe, it } from '@std/testing/bdd';
import * as CliApp from '../mod.ts';

// Disable colors for testing to simplify output comparisons
Deno.env.set('NO_COLOR', '1');

type M = MsgBuilder.Console.Builder;
type L = Log.Std.Logger<M>;

const logMgr: Log.Mgr<M> = new Log.Mgr<M>().initLevels();
logMgr.threshold = 'info';
const log: L = await logMgr.getLogger<L>();

// Minimal fake context for testing
const createTestContext = (): CliApp.ICtx<M, L> & { dryRun?: boolean; test?: boolean } => ({
  log: log,
  logMgr: logMgr,
  dryRun: true, // Assuming test mode for context
  pkg: { name: 'test', version: '1.0.0', description: 'Test package' },
  close: () => {
    return Promise.resolve();
  },
});

describe('util', () => {
  describe('configureLogging', () => {
    let testCtx: CliApp.ICtx<M, L>;

    beforeEach(() => {
      testCtx = createTestContext();
      testCtx.logMgr.threshold = 'info';
      testCtx.logMgr.show = {};
    });

    it('should set threshold from opts.log', () => {
      CliApp.configureLogging(testCtx, { log: 'warn' });
      assertEquals(testCtx.logMgr.threshold, testCtx.logMgr.logLevels.asValue('warn'));
    });

    it('should set threshold from opts.verbose', () => {
      CliApp.configureLogging(testCtx, { verbose: true });
      assertEquals(testCtx.logMgr.threshold, testCtx.logMgr.logLevels.asValue('verbose'));
    });

    it('should set threshold from opts.debug', () => {
      CliApp.configureLogging(testCtx, { debug: true });
      assertEquals(testCtx.logMgr.threshold, testCtx.logMgr.logLevels.asValue('debug'));
    });

    it('should set threshold from opts.trace', () => {
      CliApp.configureLogging(testCtx, { trace: true });
      assertEquals(testCtx.logMgr.threshold, testCtx.logMgr.logLevels.asValue('trace'));
    });

    it('should set threshold from opts.spam', () => {
      CliApp.configureLogging(testCtx, { spam: true });
      assertEquals(testCtx.logMgr.threshold, testCtx.logMgr.logLevels.asValue('spam'));
    });

    it('should throw an error if conflicting log options are provided', () => {
      assertThrows(
        () => {
          CliApp.configureLogging(testCtx, { log: 'error', debug: true });
        },
        Error,
        'Conflicting command line options',
      );
    });

    it('should throw an error if conflicting log shortcut options are provided', () => {
      assertThrows(
        () => {
          CliApp.configureLogging(testCtx, { verbose: true, debug: true });
        },
        Error,
        'Conflicting command line options',
      );
    });

    it('should configure show options from opts.showall', () => {
      CliApp.configureLogging(testCtx, { showall: true });
      assertEquals(testCtx.logMgr.show, {
        time: true,
        timestamp: 'elapsed',
        pkg: true,
        level: true,
        reqId: true,
      });
    });

    it('should configure show options from opts.log_show array', () => {
      CliApp.configureLogging(testCtx, { log_show: ['level', 'elapsed', 'pkg', 'reqId', 'time'] });
      assertEquals(testCtx.logMgr.show, {
        time: true,
        level: true,
        timestamp: 'elapsed',
        pkg: true,
        reqId: true,
      });
    });

    it('should handle specific log_show options', () => {
      CliApp.configureLogging(testCtx, { log_show: ['level'] });
      assertEquals(testCtx.logMgr.show, { level: true });

      CliApp.configureLogging(testCtx, { log_show: ['utc'] });
      assertEquals(testCtx.logMgr.show, { timestamp: 'utc' });

      CliApp.configureLogging(testCtx, { log_show: ['pkg'] });
      assertEquals(testCtx.logMgr.show, { pkg: true });
    });

    it('should handle "all" in log_show', () => {
      CliApp.configureLogging(testCtx, { log_show: ['all'] });
      assertEquals(testCtx.logMgr.show, {
        time: true,
        timestamp: 'elapsed',
        pkg: true,
        level: true,
        reqId: true,
      });
    });

    it('should set default show options if log_show is an empty array', () => {
      CliApp.configureLogging(testCtx, { log_show: [] });
      assertEquals(testCtx.logMgr.show, {
        time: true,
        level: true,
        timestamp: 'elapsed',
        pkg: true,
        reqId: true,
      });
    });

    it('should not change logMgr.show if no relevant log_show or showall options are provided', () => {
      const initialShow = { ...testCtx.logMgr.show };
      CliApp.configureLogging(testCtx, { log: 'debug' });
      assertEquals(testCtx.logMgr.show, initialShow);
    });
  });

  describe('commaList', () => {
    it('should split a comma-separated string into an array', () => {
      assertEquals(CliApp.commaList('one,two,three'), ['one', 'two', 'three']);
    });

    it('should return an array with a single element if no commas', () => {
      assertEquals(CliApp.commaList('singleitem'), ['singleitem']);
    });

    it('should return an array with an empty string if input is empty', () => {
      assertEquals(CliApp.commaList(''), ['']);
    });

    it('should handle strings with spaces around commas (no trimming)', () => {
      assertEquals(CliApp.commaList('one, two , three'), ['one', ' two ', ' three']);
    });

    it('should handle leading/trailing commas resulting in empty strings in array', () => {
      assertEquals(CliApp.commaList(',one,two,'), ['', 'one', 'two', '']);
    });
  });
});
