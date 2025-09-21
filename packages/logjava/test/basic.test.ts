import { Mgr as LogMgr } from '@epdoc/logger';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { assertEquals } from '@std/assert';
import { describe, test } from '@std/testing/bdd';
import { factoryMethods, type Logger as JavaLogger } from '../src/mod.ts';

describe('@epdoc/logjava', () => {
  test('should create Java logger with correct log levels', () => {
    const logMgr = new LogMgr<MsgBuilder.Console.Builder>();
    logMgr.loggerFactory = factoryMethods;

    const logger = logMgr.getLogger<JavaLogger<MsgBuilder.Console.Builder>>();

    // Test that all Java log level methods exist
    assertEquals(typeof logger.severe, 'object');
    assertEquals(typeof logger.warning, 'object');
    assertEquals(typeof logger.info, 'object');
    assertEquals(typeof logger.config, 'object');
    assertEquals(typeof logger.fine, 'object');
    assertEquals(typeof logger.finer, 'object');
    assertEquals(typeof logger.finest, 'object');
  });

  test('should create correct log levels', () => {
    const levels = factoryMethods.createLevels();

    // Test Java log level names (includes both warning and warn for compatibility)
    const expectedLevels = ['SEVERE', 'WARNING', 'WARN', 'INFO', 'CONFIG', 'FINE', 'FINER', 'FINEST'];
    assertEquals(levels.names, expectedLevels);

    // Test level values
    assertEquals(levels.asValue('SEVERE'), 1);
    assertEquals(levels.asValue('WARNING'), 2);
    assertEquals(levels.asValue('WARN'), 2); // Same as WARNING
    assertEquals(levels.asValue('INFO'), 3);
    assertEquals(levels.asValue('CONFIG'), 4);
    assertEquals(levels.asValue('FINE'), 5);
    assertEquals(levels.asValue('FINER'), 6);
    assertEquals(levels.asValue('FINEST'), 7);
  });

  test('should return correct log level names', () => {
    const levelNames = factoryMethods.logLevelNames();
    const expectedNames = ['severe', 'warning', 'warn', 'info', 'config', 'fine', 'finer', 'finest'];
    assertEquals(levelNames, expectedNames);
  });
});
