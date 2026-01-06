import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';
import { BufferTransport } from '../../src/transports/buffer/transport.ts';

Deno.test('Debug formatter in queue', async () => {
  const logMgr = Log.createLogManager(Console.Builder, { threshold: 'info' });
  
  // Create delayed transport to force queuing
  const delayedBuffer = new BufferTransport(logMgr, { 
    maxEntries: 100, 
    delayReady: 100 
  });
  
  logMgr.addTransport(delayedBuffer);
  
  const logger = logMgr.getLogger() as Log.Std.Logger<Console.Builder>;
  
  // Log message - should be queued
  logger.info.text('Test message').emit();
  
  console.log('Delayed buffer count immediately:', delayedBuffer.getCount());
  
  // Wait for transport to become ready
  await new Promise(resolve => setTimeout(resolve, 150));
  
  console.log('Delayed buffer count after ready:', delayedBuffer.getCount());
  console.log('Messages:', delayedBuffer.getMessages());
  
  const entries = delayedBuffer.getEntries();
  if (entries.length > 0) {
    console.log('First entry:', entries[0]);
  }
});
