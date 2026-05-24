import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import * as assert from 'node:assert';
import { BufferTransport } from '../src/transports/buffer/transport.ts';

Deno.test('BufferTransport - basic functionality', async () => {
  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();
  logMgr.threshold = 'info';
  const bufferTransport = new BufferTransport(logMgr, {});
  await logMgr.addTransport(bufferTransport);
  await logMgr.start();

  const logger = await logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  // Log some messages
  logger.info.text('Info message').emit();
  logger.error.text('Error message').emit();

  // Check entries
  const entries = bufferTransport.getEntries();
  assert.strictEqual(entries.length, 2);
  assert.ok(entries[0].msg!.includes('Info message'));
  assert.ok(entries[1].msg!.includes('Error message'));
});

Deno.test('BufferTransport - maxEntries limit', async () => {
  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();
  logMgr.threshold = 'info';
  const bufferTransport = new BufferTransport(logMgr, { maxEntries: 3 });
  await logMgr.addTransport(bufferTransport);

  const logger = await logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  // Add more messages than the limit
  for (let i = 1; i <= 5; i++) {
    logger.info.text(`Message ${i}`).emit();
  }

  // Should only keep the last 3 messages
  const entries = bufferTransport.getEntries();
  assert.strictEqual(entries.length, 3);
  assert.ok(entries[0].msg!.includes('Message 3'));
  assert.ok(entries[1].msg!.includes('Message 4'));
  assert.ok(entries[2].msg!.includes('Message 5'));
});

Deno.test('BufferTransport - utility methods', async () => {
  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();
  logMgr.threshold = 'info';
  const bufferTransport = new BufferTransport(logMgr);
  await logMgr.addTransport(bufferTransport);

  const logger = await logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  logger.info.text('First message').emit();
  logger.error.text('Second message').emit();

  // Test utility methods
  assert.strictEqual(bufferTransport.getCount(), 2);
  assert.strictEqual(bufferTransport.contains('First'), true);
  assert.strictEqual(bufferTransport.contains('Third'), false);
  assert.strictEqual(bufferTransport.matches(/Second/), true);
  assert.strictEqual(bufferTransport.matches(/Third/), false);

  const messages = bufferTransport.getMessages();
  assert.strictEqual(messages.length, 2);
  assert.ok(messages[0].includes('First message'));
  assert.ok(messages[1].includes('Second message'));
});

Deno.test('BufferTransport - assertion methods', async () => {
  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();
  logMgr.threshold = 'info';
  const bufferTransport = new BufferTransport(logMgr);
  await logMgr.addTransport(bufferTransport);

  const logger = await logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  logger.info.text('Test message').emit();
  logger.error.text('Another message').emit();

  // Test assertions that should pass
  bufferTransport.assertContains('Test message');
  bufferTransport.assertContains('Another');
  bufferTransport.assertCount(2);
  bufferTransport.assertMatches(/Test/);

  // Test assertions that should fail
  assert.throws(
    () => bufferTransport.assertContains('Missing message'),
    Error,
    'Expected log to contain "Missing message"',
  );

  assert.throws(
    () => bufferTransport.assertCount(3),
    Error,
    'Expected 3 log entries but found 2',
  );

  assert.throws(
    () => bufferTransport.assertMatches(/Missing/),
    Error,
    'Expected log to match pattern',
  );
});

Deno.test('BufferTransport - clear functionality', async () => {
  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();
  logMgr.threshold = 'info';
  const bufferTransport = new BufferTransport(logMgr);
  await logMgr.addTransport(bufferTransport);

  const logger = await logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  logger.info.text('Test message').emit();
  assert.strictEqual(bufferTransport.getCount(), 1);

  bufferTransport.clear();
  assert.strictEqual(bufferTransport.getCount(), 0);
  assert.strictEqual(bufferTransport.getEntries().length, 0);
});
