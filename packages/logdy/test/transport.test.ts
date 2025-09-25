import { assertEquals, assertExists } from '@std/assert';
import { describe, test } from '@std/testing/bdd';
import { Mgr as LogMgr, Std } from '@epdoc/logger';
import type * as MsgBuilder from '../../msgbuilder/src/mod.ts';
import { LogdyTransport } from '../src/mod.ts';

type M = MsgBuilder.Abstract;

describe('@epdoc/logdy', () => {
  test('should create LogdyTransport with default options', () => {
    const logMgr = new LogMgr<M>();
    // Initialize LogMgr by getting a logger first
    logMgr.getLogger();
    
    const transport = new LogdyTransport(logMgr);
    
    assertEquals(transport.type, 'logdy');
    assertExists(transport);
  });

  test('should create LogdyTransport with custom options', () => {
    const logMgr = new LogMgr<M>();
    logMgr.getLogger(); // Initialize
    
    const transport = new LogdyTransport(logMgr, {
      url: 'https://custom-logdy.com/api/v1/logs',
      apiKey: 'test-key',
      batchSize: 100,
      timeout: 10000
    });
    
    assertEquals(transport.type, 'logdy');
    assertExists(transport);
  });

  test('should integrate with logger and emit logs', async () => {
    const logMgr = new LogMgr<M>();
    
    // Mock fetch to capture HTTP requests
    const originalFetch = globalThis.fetch;
    let capturedRequest: { url: string; body: string } | null = null;
    
    globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
      capturedRequest = {
        url: input.toString(),
        body: init?.body as string
      };
      return new Response('{"status":"ok"}', { status: 200 });
    };

    try {
      logMgr.init();
      // Get logger first to initialize LogMgr
      const logger = logMgr.getLogger<Std.Logger<M>>();
      
      const transport = new LogdyTransport(logMgr, {
        url: 'http://test-logdy.com/api/v1/logs',
        batchSize: 1, // Force immediate flush
        flushInterval: 100
      });
      
      logMgr.addTransport(transport);
      logMgr.threshold = 'info';
      
      await logMgr.start();
      // Emit a log message
      (logger.info as MsgBuilder.Console.Builder).h1('Test message').emit();
      
      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verify the request was made
      assertExists(capturedRequest);
      // @ts-ignore
      assertEquals(capturedRequest.url, 'http://test-logdy.com/api/v1/logs');
      
      // @ts-ignore
      const requestBody = JSON.parse(capturedRequest.body);
      assertEquals(requestBody.level, 'info');
      assertEquals(requestBody.message, 'Test message');
      assertExists(requestBody.timestamp);
      
      await transport.destroy();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('should handle different log levels correctly', async () => {
    const logMgr = new LogMgr<M>();
    logMgr.getLogger(); // Initialize
    
    const transport = new LogdyTransport(logMgr);
    
    // Test level mapping through private method access
    const mapLevel = (transport as any)._mapLogLevel.bind(transport);
    
    assertEquals(mapLevel('ERROR'), 'error');
    assertEquals(mapLevel('SEVERE'), 'error');
    assertEquals(mapLevel('WARN'), 'warn');
    assertEquals(mapLevel('WARNING'), 'warn');
    assertEquals(mapLevel('INFO'), 'info');
    assertEquals(mapLevel('DEBUG'), 'debug');
    assertEquals(mapLevel('TRACE'), 'debug');
    assertEquals(mapLevel('UNKNOWN'), 'info'); // Default fallback
    
    await transport.destroy();
  });

  test('should batch logs correctly', async () => {
    const logMgr = new LogMgr<M>();
    
    let requestCount = 0;
    const originalFetch = globalThis.fetch;
    
    globalThis.fetch = async () => {
      requestCount++;
      return new Response('{"status":"ok"}', { status: 200 });
    };

    try {
      logMgr.init();
      const transport = new LogdyTransport(logMgr, {
        batchSize: 3,
        flushInterval: 1000
      });
      logMgr.addTransport(transport);
      logMgr.removeTransport(logMgr.transportMgr.transports[1]);
        batchSize: 3,
        flushInterval: 1000
      });
      
      logMgr.addTransport(transport);
      // Get logger first to initialize LogMgr
      const logger = logMgr.getLogger<Std.Logger<M>>();
      logMgr.threshold = 'info';
      
      await logMgr.start();
      // Emit 2 logs (should not trigger flush yet)
      (logger.info as MsgBuilder.Console.Builder).text('Message 1').emit();
      (logger.info as MsgBuilder.Console.Builder).text('Message 2').emit();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      assertEquals(requestCount, 0);
      
      // Emit 3rd log (should trigger batch flush)
      (logger.info as MsgBuilder.Console.Builder).text('Message 3').emit();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      assertEquals(requestCount, 1);
      
      await transport.destroy();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
