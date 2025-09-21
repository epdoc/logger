# @epdoc/logdy

Logdy transport for the `@epdoc/logger` ecosystem, enabling real-time log streaming to the [Logdy](https://logdy.dev) web interface.

## Features

- **Real-time Streaming**: Stream logs directly to Logdy web interface
- **HTTP Transport**: Uses Logdy's HTTP API for log ingestion
- **Structured Logging**: Preserves log structure and metadata
- **Level Mapping**: Maps logger levels to Logdy severity levels
- **Error Handling**: Graceful handling of network failures
- **Configurable**: Flexible configuration options for different Logdy setups

## Installation

```bash
deno add @epdoc/logdy
```

## Usage

### Basic Usage

```ts
import { Log } from '@epdoc/logger';
import { LogdyTransport } from '@epdoc/logdy';

const logMgr = new Log.Mgr();
const logger = logMgr.getLogger();

// Add Logdy transport
const logdyTransport = new LogdyTransport(logMgr, {
  url: 'http://localhost:8080/api/v1/logs',
  apiKey: 'your-api-key' // optional
});

logMgr.addTransport(logdyTransport);

// Use logger normally - logs will stream to Logdy
logger.info.h1('Application started').emit();
logger.error.text('Something went wrong').emit();
```

### Advanced Configuration

```ts
import { Log } from '@epdoc/logger';
import { LogdyTransport } from '@epdoc/logdy';

const logMgr = new Log.Mgr();
const logger = logMgr.getLogger();

const logdyTransport = new LogdyTransport(logMgr, {
  url: 'https://your-logdy-instance.com/api/v1/logs',
  apiKey: 'your-api-key',
  batchSize: 100,           // Batch logs for efficiency
  flushInterval: 5000,      // Flush every 5 seconds
  timeout: 10000,           // Request timeout
  retryAttempts: 3,         // Retry failed requests
  headers: {                // Custom headers
    'X-Source': 'my-app'
  }
});

logMgr.addTransport(logdyTransport);
```

### With Different Logger Types

```ts
import { Log } from '@epdoc/logger';
import { Java } from '@epdoc/logjava';
import { LogdyTransport } from '@epdoc/logdy';

// Use with Java logger
const logMgr = new Log.Mgr();
logMgr.loggerFactory = Java.factoryMethods;

const logger = logMgr.getLogger<Java.Logger>();
const logdyTransport = new LogdyTransport(logMgr);

logMgr.addTransport(logdyTransport);

logger.severe.h1('Critical error').emit();
logger.info.text('Application running').emit();
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | `'http://localhost:8080/api/v1/logs'` | Logdy API endpoint |
| `apiKey` | `string` | `undefined` | Optional API key for authentication |
| `batchSize` | `number` | `50` | Number of logs to batch before sending |
| `flushInterval` | `number` | `2000` | Milliseconds between automatic flushes |
| `timeout` | `number` | `5000` | Request timeout in milliseconds |
| `retryAttempts` | `number` | `2` | Number of retry attempts for failed requests |
| `headers` | `Record<string, string>` | `{}` | Additional HTTP headers |

## Logdy Integration

This transport sends logs to Logdy using the standard HTTP API format:

```json
{
  "timestamp": "2025-01-20T10:30:00.000Z",
  "level": "info",
  "message": "Application started",
  "fields": {
    "sid": "session-123",
    "reqIds": ["req-456"],
    "pkgs": ["app", "server"]
  }
}
```

## Error Handling

The transport includes robust error handling:

- **Network Failures**: Logs are queued and retried
- **Rate Limiting**: Automatic backoff and retry
- **Malformed Responses**: Graceful degradation
- **Timeout Handling**: Configurable request timeouts

## Performance

- **Batching**: Reduces HTTP overhead by batching multiple logs
- **Async Processing**: Non-blocking log transmission
- **Memory Management**: Bounded queue to prevent memory leaks
- **Efficient Serialization**: Optimized JSON serialization

## License

MIT - see LICENSE file for details.
