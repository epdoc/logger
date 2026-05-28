import { DateTime } from '@epdoc/datetime';
import type { Console } from '@epdoc/msgbuilder';
import * as assert from 'node:assert';
import * as Log from '../src/mod.ts';
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

  assert.strictEqual(mockFetch.calls.length, 1);
  const call = mockFetch.getLastCall()!;
  assert.strictEqual(call.method, 'POST');
  assert.ok(call.url.includes('/api/v2/write'));
  assert.ok(call.url.includes('org=test-org'));
  assert.ok(call.url.includes('bucket=test-bucket'));
  assert.strictEqual(call.headers['Authorization'], 'Token test-token');
  assert.ok(call.body.includes('logs,level=INFO,service=test-service,environment=test'));
  assert.ok(call.body.includes('message="Test message"'));

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
  assert.strictEqual(mockFetch.calls.length, 0);

  // Emit 100th message (should trigger batch transmission)
  logger.info.text('Message 100').emit();

  // Wait for async transmission
  await delay(100);

  assert.strictEqual(mockFetch.calls.length, 1);
  const call = mockFetch.getLastCall()!;

  // Should contain all 100 messages
  const lines = call.body.split('\n');
  assert.strictEqual(lines.length, 100);
  assert.ok(lines[0].includes('Message 1'));
  assert.ok(lines[99].includes('Message 100'));

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
  assert.strictEqual(mockFetch.calls.length, 0);

  // Wait for time-based flush (600ms)
  await delay(600);

  assert.strictEqual(mockFetch.calls.length, 1);
  const call = mockFetch.getLastCall()!;

  // Should contain the 3 messages
  const lines = call.body.split('\n');
  assert.strictEqual(lines.length, 3);
  assert.ok(lines[0].includes('Message 1'));
  assert.ok(lines[2].includes('Message 3'));

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
  assert.strictEqual(mockFetch.calls.length, 3);

  // All calls should have the same body
  const firstBody = mockFetch.calls[0].body;
  assert.strictEqual(mockFetch.calls[1].body, firstBody);
  assert.strictEqual(mockFetch.calls[2].body, firstBody);

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
  assert.strictEqual(mockFetch.calls.length, 2);

  // Both calls should have the same message
  assert.strictEqual(mockFetch.calls[0].body, mockFetch.calls[1].body);
  assert.ok(mockFetch.calls[0].body.includes('Retry test message'));

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
  assert.strictEqual(mockFetch.calls.length, 3);

  // Now emit a new message - should trigger summary first
  logger.info.text('New message').emit();
  await influxTransport.flush();
  await delay(100);

  // Should have made at least one more call for the summary
  const finalCallCount = mockFetch.calls.length;
  assert.ok(finalCallCount >= 4, `Expected at least 4 calls, got ${finalCallCount}`);

  // Find the summary call (should contain dropped message info)
  const summaryCall = mockFetch.calls.find((call) => call.body.includes('log messages could not be transmitted'));

  if (!summaryCall) {
    throw new Error('Summary call not found in: ' + JSON.stringify(mockFetch.calls.map((c) => c.body)));
  }

  // Verify summary message content
  assert.ok(summaryCall.body.includes('2 log messages could not be transmitted'));
  assert.ok(summaryCall.body.includes('data_dropped='));
  assert.ok(summaryCall.body.includes('\\"total\\":2'));
  assert.ok(summaryCall.body.includes('\\"info\\":1'));
  assert.ok(summaryCall.body.includes('\\"error\\":1'));
  assert.ok(summaryCall.body.includes('level=WARN'));

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
    level: logMgr.asSpec('error'),
    pkg: 'test.module',
    msg: 'Error occurred',
    reqId: 'req-123',
    sid: 'session-456',
    data: { userId: 789, action: 'login' },
    hrMsTime: 1500, // 1.5 seconds
    timestamp: DateTime.from('2024-01-01T12:00:00Z'),
  };

  influxTransport.emit(entry);
  await influxTransport.flush();
  await delay(100);

  assert.strictEqual(mockFetch.calls.length, 1);
  const call = mockFetch.getLastCall()!;

  // Check tags (low cardinality)
  assert.ok(call.body.includes('level=ERROR'));
  assert.ok(call.body.includes('service=test-service'));
  assert.ok(call.body.includes('environment=production'));
  assert.ok(call.body.includes('package=test.module'));

  // Check fields (high cardinality)
  assert.ok(call.body.includes('message="Error occurred"'));
  assert.ok(call.body.includes('request_id="req-123"'));
  assert.ok(call.body.includes('session_id="session-456"'));
  assert.ok(call.body.includes('duration_ms=1500'));
  assert.ok(call.body.includes('data_userId=789'));
  assert.ok(call.body.includes('data_action="login"'));

  // Check timestamp (nanoseconds)
  assert.ok(call.body.includes('1704110400000000000'));

  await influxTransport.stop();
  mockFetch.restore();
});
