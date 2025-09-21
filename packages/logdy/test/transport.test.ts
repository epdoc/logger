import { assertEquals, assertExists } from '@std/assert';
import { describe, test } from '@std/testing/bdd';
import { Mgr as LogMgr, Std } from '@epdoc/logger';
import type * as MsgBuilder from '@epdoc/msgbuilder';
import { LogdyTransport } from '../src/mod.ts';

type M = MsgBuilder.Console.Builder;

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
      // Get logger first to initialize LogMgr
      const logger = logMgr.getLogger<Std.Logger<M>>();
      
      const transport = new LogdyTransport(logMgr, {
        url: 'http://test-logdy.com/api/v1/logs',
        batchSize: 1, // Force immediate flush
        flushInterval: 100
      });
      
      logMgr.addTransport(transport);
      logMgr.threshold = 'info';
      
      // Emit a log message
      logger.info.h1('Test message').emit();
      
      // Wait for async flush
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Verify the request was made
      assertExists(capturedRequest);
      assertEquals(capturedRequest.url, 'http://test-logdy.com/api/v1/logs');
      
      const requestBody = JSON.parse(capturedRequest.body);
      assertExists(requestBody.logs);
      assertEquals(requestBody.logs.length, 1);
      
      const logEntry = requestBody.logs[0];
      assertEquals(logEntry.level, 'info');
      assertEquals(logEntry.message, 'Test message');
      assertExists(logEntry.timestamp);
      
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
      // Get logger first to initialize LogMgr
      const logger = logMgr.getLogger<Std.Logger<M>>();
      
      const transport = new LogdyTransport(logMgr, {
        batchSize: 3,
        flushInterval: 1000
      });
      
      logMgr.addTransport(transport);
      logMgr.threshold = 'info';
      
      // Emit 2 logs (should not trigger flush yet)
      logger.info.text('Message 1').emit();
      logger.info.text('Message 2').emit();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      assertEquals(requestCount, 0);
      
      // Emit 3rd log (should trigger batch flush)
      logger.info.text('Message 3').emit();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      assertEquals(requestCount, 1);
      
      await transport.destroy();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
