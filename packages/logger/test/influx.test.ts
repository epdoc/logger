import * as Log from '@epdoc/logger';
import type { Console } from '@epdoc/msgbuilder';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { InfluxTransport } from '../src/transports/influx/transport.ts';

// Mock fetch responses
interface MockFetchCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

class MockFetch {
  calls: MockFetchCall[] = [];
  responses: Response[] = [];
  responseIndex = 0;
  originalFetch: typeof globalThis.fetch;

  constructor() {
    // Store original fetch and replace with our mock
    this.originalFetch = globalThis.fetch;
    globalThis.fetch = this.mockFetch.bind(this);
  }

  addResponse(status: number, text = '') {
    if (status === 204) {
      // 204 No Content cannot have a body
      this.responses.push(new Response(null, { status }));
    } else {
      this.responses.push(new Response(text, { status }));
    }
  }

  mockFetch(input: URL | RequestInfo, init?: RequestInit): Promise<Response> {
    let url: string;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      // input is Request
      url = input.url;
    }

    const call: MockFetchCall = {
      url,
      method: init?.method || 'GET',
      headers: this.extractHeaders(init?.headers),
      body: init?.body as string || '',
    };
    this.calls.push(call);

    if (this.responseIndex < this.responses.length) {
      return Promise.resolve(this.responses[this.responseIndex++]);
    }

    // Default success response
    return Promise.resolve(new Response(null, { status: 204 }));
  }

  private extractHeaders(headers: HeadersInit | undefined): Record<string, string> {
    if (!headers) return {};

    if (headers instanceof Headers) {
      const result: Record<string, string> = {};
      headers.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }

    if (Array.isArray(headers)) {
      const result: Record<string, string> = {};
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
      return result;
    }

    // headers is Record<string, string>
    return headers as Record<string, string>;
  }

  restore() {
    globalThis.fetch = this.originalFetch;
  }

  reset() {
    this.calls = [];
    this.responses = [];
    this.responseIndex = 0;
  }

  getLastCall(): MockFetchCall | undefined {
    return this.calls[this.calls.length - 1];
  }
}

// Helper to wait for async operations
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.test('InfluxTransport - basic message emission', async () => {
  const mockFetch = new MockFetch();
  mockFetch.addResponse(204); // Success response

  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();
  logMgr.threshold = 'info';

  const influxTransport = new InfluxTransport(logMgr, {
    host: 'http://localhost:8086',
    org: 'test-org',
    bucket: 'test-bucket',
    token: 'test-token',
    service: 'test-service',
    environment: 'test',
  });

  await logMgr.addTransport(influxTransport);
  await logMgr.start();

  const logger = await logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  // Emit a single message
  logger.info.text('Test message').emit();

  // Force flush to trigger transmission
  await influxTransport.flush();

  // Wait for async transmission
  await delay(100);

  assertEquals(mockFetch.calls.length, 1);
  const call = mockFetch.getLastCall()!;
  assertEquals(call.method, 'POST');
  assertStringIncludes(call.url, '/api/v2/write');
  assertStringIncludes(call.url, 'org=test-org');
  assertStringIncludes(call.url, 'bucket=test-bucket');
  assertEquals(call.headers['Authorization'], 'Token test-token');
  assertStringIncludes(call.body, 'logs,level=INFO,service=test-service,environment=test');
  assertStringIncludes(call.body, 'message="Test message"');

  await influxTransport.stop();
  mockFetch.restore();
});

Deno.test('InfluxTransport - batch size threshold', async () => {
  const mockFetch = new MockFetch();
  mockFetch.addResponse(204); // Success response

  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();
  logMgr.threshold = 'info';

  const influxTransport = new InfluxTransport(logMgr, {
    host: 'http://localhost:8086',
    org: 'test-org',
    bucket: 'test-bucket',
    token: 'test-token',
  });

  await logMgr.addTransport(influxTransport);
  await logMgr.start();

  const logger = await logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  // Emit 99 messages (below batch threshold)
  for (let i = 1; i <= 99; i++) {
    logger.info.text(`Message ${i}`).emit();
  }

  // Should not have triggered transmission yet
  assertEquals(mockFetch.calls.length, 0);

  // Emit 100th message (should trigger batch transmission)
  logger.info.text('Message 100').emit();

  // Wait for async transmission
  await delay(100);

  assertEquals(mockFetch.calls.length, 1);
  const call = mockFetch.getLastCall()!;

  // Should contain all 100 messages
  const lines = call.body.split('\n');
  assertEquals(lines.length, 100);
  assertStringIncludes(lines[0], 'Message 1');
  assertStringIncludes(lines[99], 'Message 100');

  await influxTransport.stop();
  mockFetch.restore();
});

Deno.test('InfluxTransport - time-based flushing', async () => {
  const mockFetch = new MockFetch();
  mockFetch.addResponse(204); // Success response

  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();
  logMgr.threshold = 'info';

  const influxTransport = new InfluxTransport(logMgr, {
    host: 'http://localhost:8086',
    org: 'test-org',
    bucket: 'test-bucket',
    token: 'test-token',
    flushInterval: 500, // 500ms for faster testing
  });

  await logMgr.addTransport(influxTransport);
  await logMgr.start();

  const logger = await logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  // Emit a few messages (below batch threshold)
  logger.info.text('Message 1').emit();
  logger.info.text('Message 2').emit();
  logger.info.text('Message 3').emit();

  // Should not have triggered transmission yet
  assertEquals(mockFetch.calls.length, 0);

  // Wait for time-based flush (600ms)
  await delay(600);

  assertEquals(mockFetch.calls.length, 1);
  const call = mockFetch.getLastCall()!;

  // Should contain the 3 messages
  const lines = call.body.split('\n');
  assertEquals(lines.length, 3);
  assertStringIncludes(lines[0], 'Message 1');
  assertStringIncludes(lines[2], 'Message 3');

  await influxTransport.stop();
  mockFetch.restore();
});

Deno.test('InfluxTransport - retry logic on failure', async () => {
  const mockFetch = new MockFetch();
  // First two attempts fail, third succeeds
  mockFetch.addResponse(500, 'Internal Server Error');
  mockFetch.addResponse(500, 'Internal Server Error');
  mockFetch.addResponse(204); // Success

  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();
  logMgr.threshold = 'info';

  const influxTransport = new InfluxTransport(logMgr, {
    host: 'http://localhost:8086',
    org: 'test-org',
    bucket: 'test-bucket',
    token: 'test-token',
    retryBaseDelay: 100, // 100ms for faster testing
  });

  await logMgr.addTransport(influxTransport);
  await logMgr.start();

  const logger = await logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  logger.info.text('Test message').emit();

  // Force flush to trigger transmission
  await influxTransport.flush();

  // Wait for retries (exponential backoff: 200ms, 400ms, 800ms)
  await delay(1500);

  // Should have made 3 attempts
  assertEquals(mockFetch.calls.length, 3);

  // All calls should have the same body
  const firstBody = mockFetch.calls[0].body;
  assertEquals(mockFetch.calls[1].body, firstBody);
  assertEquals(mockFetch.calls[2].body, firstBody);

  await influxTransport.stop();
  mockFetch.restore();
});

Deno.test('InfluxTransport - retry behavior verification', async () => {
  const mockFetch = new MockFetch();
  // First attempt fails, second succeeds
  mockFetch.addResponse(500, 'Internal Server Error');
  mockFetch.addResponse(204); // Success

  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();
  logMgr.threshold = 'info';

  const influxTransport = new InfluxTransport(logMgr, {
    host: 'http://localhost:8086',
    org: 'test-org',
    bucket: 'test-bucket',
    token: 'test-token',
    retryBaseDelay: 100, // 100ms for faster testing
  });

  await logMgr.addTransport(influxTransport);
  await logMgr.start();

  const logger = await logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  logger.info.text('Retry test message').emit();

  // Force flush to trigger transmission
  await influxTransport.flush();

  // Wait for retry (200ms exponential backoff)
  await delay(400);

  // Should have made 2 attempts (first failed, second succeeded)
  assertEquals(mockFetch.calls.length, 2);

  // Both calls should have the same message
  assertEquals(mockFetch.calls[0].body, mockFetch.calls[1].body);
  assertStringIncludes(mockFetch.calls[0].body, 'Retry test message');

  await influxTransport.stop();
  mockFetch.restore();
});

Deno.test('InfluxTransport - concurrent transmission protection', async () => {
  const mockFetch = new MockFetch();

  // Create a slow response promise
  let resolveResponse: (value: Response) => void;
  const slowResponse = new Promise<Response>((resolve) => {
    resolveResponse = resolve;
  });

  // Override the mock to return the slow response
  globalThis.fetch = async (): Promise<Response> => {
    return await slowResponse;
  };

  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();
  logMgr.threshold = 'info';

  const influxTransport = new InfluxTransport(logMgr, {
    host: 'http://localhost:8086',
    org: 'test-org',
    bucket: 'test-bucket',
    token: 'test-token',
  });

  await logMgr.addTransport(influxTransport);
  await logMgr.start();

  const logger = await logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  // Emit first batch
  for (let i = 1; i <= 100; i++) {
    logger.info.text(`Batch 1 Message ${i}`).emit();
  }

  // This should trigger transmission but not complete yet
  await delay(100);

  // Emit second batch while first is still transmitting
  for (let i = 1; i <= 100; i++) {
    logger.info.text(`Batch 2 Message ${i}`).emit();
  }

  // Second batch should be queued, not transmitted
  await delay(100);

  // Complete the first transmission
  resolveResponse!(new Response(null, { status: 204 }));

  await delay(100);

  // Now the second batch should be transmitted
  mockFetch.addResponse(204);
  await influxTransport.flush();
  await delay(100);

  await influxTransport.stop();
  mockFetch.restore();
});

Deno.test('InfluxTransport - dropped message tracking', async () => {
  const mockFetch = new MockFetch();
  // All attempts fail for first batch
  mockFetch.addResponse(500, 'Internal Server Error');
  mockFetch.addResponse(500, 'Internal Server Error');
  mockFetch.addResponse(500, 'Internal Server Error');
  // Summary message succeeds
  mockFetch.addResponse(204);

  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();
  logMgr.threshold = 'debug'; // Include debug messages

  const influxTransport = new InfluxTransport(logMgr, {
    host: 'http://localhost:8086',
    org: 'test-org',
    bucket: 'test-bucket',
    token: 'test-token',
    maxRetries: 3,
    retryBaseDelay: 50, // Fast testing
  });

  await logMgr.addTransport(influxTransport);
  await logMgr.start();

  const logger = await logMgr.getLogger() as Log.Std.Logger<Console.Builder>;

  // Emit messages that will be dropped
  logger.info.text('Lost message 1').emit();
  logger.error.text('Lost message 2').emit();
  logger.debug.text('Lost message 3').emit();

  // Force flush to trigger transmission and failure
  await influxTransport.flush();

  // Wait for all retries to complete
  await delay(500);

  // Should have made 3 failed attempts
  assertEquals(mockFetch.calls.length, 3);

  // Now emit a new message - should trigger summary first
  logger.info.text('New message').emit();
  await influxTransport.flush();
  await delay(100);

  // Should have made at least one more call for the summary
  const finalCallCount = mockFetch.calls.length;
  assertEquals(finalCallCount >= 4, true, `Expected at least 4 calls, got ${finalCallCount}`);

  // Find the summary call (should contain dropped message info)
  const summaryCall = mockFetch.calls.find((call) => call.body.includes('log messages could not be transmitted'));

  if (!summaryCall) {
    throw new Error('Summary call not found in: ' + JSON.stringify(mockFetch.calls.map((c) => c.body)));
  }

  // Verify summary message content
  assertStringIncludes(summaryCall.body, '2 log messages could not be transmitted');
  assertStringIncludes(summaryCall.body, 'data_dropped=');
  assertStringIncludes(summaryCall.body, '\\"total\\":2');
  assertStringIncludes(summaryCall.body, '\\"info\\":1');
  assertStringIncludes(summaryCall.body, '\\"error\\":1');
  assertStringIncludes(summaryCall.body, 'level=WARN');

  await influxTransport.stop();
  mockFetch.restore();
});

Deno.test('InfluxTransport - message formatting with metadata', async () => {
  const mockFetch = new MockFetch();
  mockFetch.addResponse(204);

  const logMgr = new Log.Mgr<Console.Builder>();
  logMgr.initLevels();
  logMgr.threshold = 'info';

  const influxTransport = new InfluxTransport(logMgr, {
    host: 'http://localhost:8086',
    org: 'test-org',
    bucket: 'test-bucket',
    token: 'test-token',
    service: 'test-service',
    environment: 'production',
  });

  await logMgr.addTransport(influxTransport);
  await logMgr.start();

  const _logger = await logMgr.getLogger<Log.Std.Logger<Console.Builder>>();

  // Create a log entry with metadata
  const entry: Log.Entry = {
    level: 'error',
    pkg: 'test.module',
    msg: 'Error occurred',
    reqId: 'req-123',
    sid: 'session-456',
    data: { userId: 789, action: 'login' },
    time: 1500, // 1.5 seconds
    timestamp: new Date('2024-01-01T12:00:00Z'),
  };

  influxTransport.emit(entry);
  await influxTransport.flush();
  await delay(100);

  assertEquals(mockFetch.calls.length, 1);
  const call = mockFetch.getLastCall()!;

  // Check tags (low cardinality)
  assertStringIncludes(call.body, 'level=ERROR');
  assertStringIncludes(call.body, 'service=test-service');
  assertStringIncludes(call.body, 'environment=production');
  assertStringIncludes(call.body, 'package=test.module');

  // Check fields (high cardinality)
  assertStringIncludes(call.body, 'message="Error occurred"');
  assertStringIncludes(call.body, 'request_id="req-123"');
  assertStringIncludes(call.body, 'session_id="session-456"');
  assertStringIncludes(call.body, 'duration_ms=1500');
  assertStringIncludes(call.body, 'data_userId=789');
  assertStringIncludes(call.body, 'data_action="login"');

  // Check timestamp (nanoseconds)
  assertStringIncludes(call.body, '1704110400000000000');

  await influxTransport.stop();
  mockFetch.restore();
});
