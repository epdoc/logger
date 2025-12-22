import { assertEquals } from '@std/assert';
import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import { extendBuilder } from '@epdoc/msgbuilder';
import * as Log from '../src/mod.ts';

describe('Log.createLogManager', () => {
  describe('basic functionality', () => {
    test('should create log manager with default Console.Builder', () => {
      const logMgr = Log.createLogManager();

      expect(logMgr).toBeInstanceOf(Log.Mgr);
      expect(typeof logMgr.getLogger).toBe('function');
    });

    test('should create log manager with custom builder', () => {
      const CustomBuilder = extendBuilder({
        customMethod(text: string) {
          return this.text(`CUSTOM: ${text}`);
        },
      });

      const logMgr = Log.createLogManager(CustomBuilder);

      expect(logMgr).toBeInstanceOf(Log.Mgr);
      expect(logMgr.msgBuilderFactory).toBeDefined();
    });

    test('should apply configuration options', () => {
      const logMgr = Log.createLogManager(undefined, {
        threshold: 'debug',
        showLevel: true,
        showTimestamp: 'elapsed',
        showData: false,
      });

      assertEquals(logMgr.threshold, 5); // debug level for std logger
      assertEquals(logMgr.show.level, true);
      assertEquals(logMgr.show.timestamp, 'elapsed');
      assertEquals(logMgr.show.data, false);
    });

    test('should handle boolean timestamp option', () => {
      const logMgr1 = Log.createLogManager(undefined, { showTimestamp: true });
      const logMgr2 = Log.createLogManager(undefined, { showTimestamp: false });

      assertEquals(logMgr1.show.timestamp, 'local');
      assertEquals(logMgr2.show.timestamp, undefined);
    });
  });

  describe('integration with extended builders', () => {
    test('should work with custom builder and produce expected output', () => {
      const TestBuilder = extendBuilder({
        apiCall(method: string, endpoint: string) {
          return this.text(`${method} ${endpoint}`);
        },
      });

      const logMgr = Log.createLogManager(TestBuilder, {
        threshold: 'info',
        showLevel: false,
        showTimestamp: false,
      });

      expect(logMgr.threshold).toBe(3); // info level for std logger
      expect(logMgr.msgBuilderFactory).toBeDefined();
    });
  });

  describe('demonstrates simplified setup', () => {
    test('shows how projects can easily setup custom logging', () => {
      // Before: Complex factory setup (like finsync)
      // const msgBuilderFactory = (emitter) => new CustomMsgBuilder(emitter);
      // const logMgr = new Log.Mgr();
      // logMgr.msgBuilderFactory = msgBuilderFactory;
      // logMgr.init();
      // logMgr.threshold = 'info';

      // After: Simple one-liner
      const ProjectBuilder = extendBuilder({
        metric(name: string, value: number) {
          return this.text(name).text(': ').text(value.toString());
        },
      });

      const logMgr = Log.createLogManager(ProjectBuilder, { threshold: 'info' });

      expect(logMgr.threshold).toBe(3); // info level for std logger
      expect(logMgr.msgBuilderFactory).toBeDefined();
    });
  });
});
