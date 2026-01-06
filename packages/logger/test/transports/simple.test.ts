import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import { assertEquals } from '@std/assert';
import { BufferTransport } from '../../src/transports/buffer/transport.ts';

Deno.test('Simple buffer transport test', () => {
  const logMgr = Log.createLogManager(Console.Builder, { threshold: 'info' });
  const bufferTransport = new BufferTransport(logMgr, { maxEntries: 100 });
  
  // Clear any default transports and add only our buffer
  logMgr.transportMgr.transports.length = 0;
  logMgr.addTransport(bufferTransport);
  
  const logger = logMgr.getLogger() as Log.Std.Logger<Console.Builder>;
  
  // Log a simple message
  logger.info.text('Simple test message').emit();
  
  // Check if message was captured
  console.log('Buffer count:', bufferTransport.getCount());
  console.log('Buffer messages:', bufferTransport.getMessages());
  console.log('Buffer entries:', bufferTransport.getEntries());
  
  assertEquals(bufferTransport.getCount(), 1);
});
