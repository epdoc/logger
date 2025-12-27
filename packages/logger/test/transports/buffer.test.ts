import * as Log from '@epdoc/logger';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { Console } from '@epdoc/msgbuilder';
import { assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { BufferTransport } from '../../src/transports/buffer/transport.ts';

Deno.test('BufferTransport - basic functionality', () => {
  const logMgr = Log.createLogManager(Console.Builder, { threshold: 'info' });
  const bufferTransport = new BufferTransport(logMgr as unknown as Log.Mgr<MsgBuilder.Abstract>);
  logMgr.addTransport(bufferTransport);

  const logger = logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  // Log some messages
  logger.info.text('Info message').emit();
  logger.error.text('Error message').emit();

  // Check entries
  const entries = bufferTransport.getEntries();
  assertEquals(entries.length, 2);
  assertStringIncludes(entries[0].message, 'Info message');
  assertStringIncludes(entries[1].message, 'Error message');
});

Deno.test('BufferTransport - maxEntries limit', () => {
  const logMgr = Log.createLogManager(Console.Builder, { threshold: 'info' });
  const bufferTransport = new BufferTransport(logMgr as unknown as Log.Mgr<MsgBuilder.Abstract>, { maxEntries: 3 });
  logMgr.addTransport(bufferTransport);

  const logger = logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  // Add more messages than the limit
  for (let i = 1; i <= 5; i++) {
    logger.info.text(`Message ${i}`).emit();
  }

  // Should only keep the last 3 messages
  const entries = bufferTransport.getEntries();
  assertEquals(entries.length, 3);
  assertStringIncludes(entries[0].message, 'Message 3');
  assertStringIncludes(entries[1].message, 'Message 4');
  assertStringIncludes(entries[2].message, 'Message 5');
});

Deno.test('BufferTransport - utility methods', () => {
  const logMgr = Log.createLogManager(Console.Builder, { threshold: 'info' });
  const bufferTransport = new BufferTransport(logMgr as unknown as Log.Mgr<MsgBuilder.Abstract>);
  logMgr.addTransport(bufferTransport);

  const logger = logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  logger.info.text('First message').emit();
  logger.error.text('Second message').emit();

  // Test utility methods
  assertEquals(bufferTransport.getCount(), 2);
  assertEquals(bufferTransport.contains('First'), true);
  assertEquals(bufferTransport.contains('Third'), false);
  assertEquals(bufferTransport.matches(/Second/), true);
  assertEquals(bufferTransport.matches(/Third/), false);

  const messages = bufferTransport.getMessages();
  assertEquals(messages.length, 2);
  assertStringIncludes(messages[0], 'First message');
  assertStringIncludes(messages[1], 'Second message');
});

Deno.test('BufferTransport - assertion methods', () => {
  const logMgr = Log.createLogManager<Console.Builder>(Console.Builder, { threshold: 'info' });
  const bufferTransport = new BufferTransport(logMgr as unknown as Log.Mgr<MsgBuilder.Abstract>);
  logMgr.addTransport(bufferTransport);

  const logger = logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  logger.info.text('Test message').emit();
  logger.error.text('Another message').emit();

  // Test assertions that should pass
  bufferTransport.assertContains('Test message');
  bufferTransport.assertContains('Another');
  bufferTransport.assertCount(2);
  bufferTransport.assertMatches(/Test/);

  // Test assertions that should fail
  assertThrows(
    () => bufferTransport.assertContains('Missing message'),
    Error,
    'Expected log to contain "Missing message"',
  );

  assertThrows(
    () => bufferTransport.assertCount(3),
    Error,
    'Expected 3 log entries but found 2',
  );

  assertThrows(
    () => bufferTransport.assertMatches(/Missing/),
    Error,
    'Expected log to match pattern',
  );
});

Deno.test('BufferTransport - clear functionality', () => {
  const logMgr = Log.createLogManager(Console.Builder, { threshold: 'info' });
  const bufferTransport = new BufferTransport(logMgr as unknown as Log.Mgr<MsgBuilder.Abstract>);
  logMgr.addTransport(bufferTransport);

  const logger = logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  logger.info.text('Test message').emit();
  assertEquals(bufferTransport.getCount(), 1);

  bufferTransport.clear();
  assertEquals(bufferTransport.getCount(), 0);
  assertEquals(bufferTransport.getEntries().length, 0);
});
