import * as Log from '../src/mod.ts';
import type { Console } from '@epdoc/msgbuilder';
import * as assert from 'node:assert';
import { BufferTransport } from '../src/transports/buffer/transport.ts';

Deno.test('Multiple transports - message ordering with delayed ready', async () => {
  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();

  // Create two buffer transports - one immediate, one delayed
  const immediateBuffer = new BufferTransport(logMgr, { maxEntries: 100 });
  const delayedBuffer = new BufferTransport(logMgr, {
    maxEntries: 100,
    delayReady: 100, // 100ms delay
  });

  logMgr.addTransport(immediateBuffer);
  logMgr.addTransport(delayedBuffer);

  // This will wait for transports to become ready
  const logger = await logMgr.getLogger<Log.Std.Logger<Console.Builder>>();

  // Log messages immediately - should be queued until all transports ready
  logger.info.text('Message 1').emit();
  logger.info.text('Message 2').emit();
  logger.info.text('Message 3').emit();

  // Initially, immediate transport should have no messages (queued)
  assert.strictEqual(immediateBuffer.getCount(), 3);
  assert.strictEqual(delayedBuffer.getCount(), 3);

  // Wait for delayed transport to become ready
  await new Promise((resolve) => setTimeout(resolve, 150));

  // Now both transports should have all messages in correct order
  assert.strictEqual(immediateBuffer.getCount(), 3);
  assert.strictEqual(delayedBuffer.getCount(), 3);

  const immediateMessages = immediateBuffer.getMessages();
  const delayedMessages = delayedBuffer.getMessages();

  // Verify message order
  assert.ok(immediateMessages[0].includes('Message 1'));
  assert.ok(immediateMessages[1].includes('Message 2'));
  assert.ok(immediateMessages[2].includes('Message 3'));

  assert.ok(delayedMessages[0].includes('Message 1'));
  assert.ok(delayedMessages[1].includes('Message 2'));
  assert.ok(delayedMessages[2].includes('Message 3'));
});

Deno.test('Multiple transports - different types', async () => {
  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();

  // Create buffer and console transports
  const bufferTransport = new BufferTransport(logMgr, { delayReady: 50 });
  const consoleTransport = new Log.Transport.Console.Transport(logMgr);

  logMgr.addTransport(bufferTransport);
  logMgr.addTransport(consoleTransport);

  const logger = await logMgr.getLogger<Log.Std.Logger<Console.Builder>>();

  // Log before buffer is ready
  logger.info.text('Test message').emit();

  // Buffer should be empty initially
  assert.strictEqual(bufferTransport.getCount(), 1);

  // Wait for buffer to become ready
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Buffer should now have the message
  assert.strictEqual(bufferTransport.getCount(), 1);
  bufferTransport.assertContains('Test message');
});

Deno.test('Multiple transports - same type different configs', async () => {
  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();

  // Create two buffer transports with different configs
  const buffer1 = new BufferTransport(logMgr, { maxEntries: 5 });
  const buffer2 = new BufferTransport(logMgr, { maxEntries: 10, delayReady: 50 });

  logMgr.addTransport(buffer1);
  logMgr.addTransport(buffer2);

  const logger = await logMgr.getLogger<Log.Std.Logger<Console.Builder>>();

  logger.info.text('Test message').emit();

  // Wait for all transports to be ready
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Both should have the message
  assert.strictEqual(buffer1.getCount(), 1);
  assert.strictEqual(buffer2.getCount(), 1);

  buffer1.assertContains('Test message');
  buffer2.assertContains('Test message');
});
