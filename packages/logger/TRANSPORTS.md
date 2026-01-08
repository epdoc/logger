# Transports

Transports are responsible for outputting log messages to various destinations. The logger supports multiple transport types that can be used individually or combined.

## Available Transports

### Default Transport

The Console transport is used by default

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

type MsgBuilder = Console.Builder;
type Logger = Log.Std.Logger<MsgBuilder>;

const logMgr = new Log.Mgr<MsgBuilder>();
const logger = await logMgr.getLogger<Logger>();
logger.info.h2('Starting application').emit();
```

### Console Transport

Outputs log messages to the console with color formatting and customizable output options.

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

const logMgr = new Log.Mgr<Console.Builder>();
// The following lines are not actually necessary. 
// They show the default configuration when no other transports are added.
const consoleTransport = new Log.Transport.Console.Transport(logMgr);
await logMgr.addTransport(consoleTransport);
logMgr.threshold = 'info';

const logger = await logMgr.getLogger();
logger.info.h2('Starting application').emit();
```

**Features:**
- Color-coded output based on log level
- Customizable formatting options
- Support for different output streams (stdout/stderr)
- ANSI color support detection

### File Transport

Writes log messages to files with support for rotation, buffering, and different file modes.

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

const logMgr = new Log.Mgr<Console.Builder>();
const fileTransport = new Log.Transport.File.Transport(logMgr, {
  filename: 'app.log',
  bufferSize: 4096,
  mode: 'append'
});
await logMgr.addTransport(fileTransport);
logMgr.threshold = 'debug';           // The default threshold is 'info'
```

**Features:**
- File rotation support
- Configurable buffer sizes
- Multiple file modes (append, overwrite)
- Automatic directory creation
- Graceful error handling

### InfluxDB Transport

Sends log messages to InfluxDB for time-series analysis and Grafana visualization with optimized batching and retry logic.

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

const logMgr = new Log.Mgr<Console.Builder>();
const influxTransport = new Log.Transport.Influx.Transport(logMgr, {
  host: 'http://localhost:8086',
  token: 'your-influx-token',
  org: 'your-org',
  bucket: 'logs',
  service: 'my-app',
  environment: 'production'
});
await logMgr.addTransport(influxTransport);
logMgr.threshold = 'debug';
```

**Features:**
- Automatic batching (100 messages per batch, 5-second intervals)
- Retry logic with exponential backoff (up to 3 attempts)
- Optimized tag/field mapping for Grafana integration
- Configurable service, environment, and hostname context
- Graceful error handling and connection recovery

**Data Structure:**
- **Tags** (low cardinality): `level`, `service`, `environment`, `host`, `package`
- **Fields** (high cardinality): `message`, `request_id`, `session_id`, `duration_ms`, `data_*`

### Buffer Transport

Captures log messages in memory for testing and programmatic inspection.

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

const logMgr = new Log.Mgr();

const bufferTransport = new Log.Transport.Buffer.BufferTransport(logMgr, {
  maxEntries: 1000,
  delayReady: 100  // Delay 100ms before transport becomes ready
});
await logMgr.addTransport(bufferTransport);

// This will set our logLevels to the default set, and start the transports.
// Messages will be queued until the transports are ready.
const logger = await logMgr.getLogger();
logger.info.text('Test message').emit();

// Inspect captured logs
const entries = bufferTransport.getEntries();
bufferTransport.assertContains('Test message');
```

**Features:**
- In-memory log capture
- Configurable entry limits with FIFO behavior
- Rich inspection API
- Built-in assertion methods for testing
- Level-based filtering
- Pattern matching support

**Testing Methods:**
- `getEntries()` - Get all captured entries
- `getEntriesByLevel(level)` - Filter by log level
- `contains(text)` - Check if any message contains text
- `matches(pattern)` - Check if any message matches regex
- `assertContains(text)` - Assert message contains text
- `assertCount(n)` - Assert exact number of entries
- `assertMatches(pattern)` - Assert message matches pattern
- `clear()` - Clear all captured entries

## Using Multiple Transports

You can combine multiple transports to output logs to different destinations:

```typescript
import * as Log from '@epdoc/logger';
import { Console } from '@epdoc/msgbuilder';

const logMgr = new Log.Mgr<Console.Builder>();
const consoleTransport = new Log.Transport.Console.Transport(logMgr);
const fileTransport = new Log.Transport.File.Transport(logMgr, { filename: 'app.log' });
const influxTransport = new Log.Transport.Influx.Transport(logMgr, {
  host: 'http://localhost:8086',
  token: 'your-token',
  org: 'your-org',
  bucket: 'logs'
});

logMgr.addTransport(consoleTransport);
logMgr.addTransport(fileTransport);
logMgr.addTransport(influxTransport);
logMgr.threshold = 'info';
```

## Transport Configuration

Each transport can be configured with specific options:

### Console Transport Options

```typescript
interface IConsoleTransportOptions {
  /** Output stream (stdout/stderr) */
  stream?: 'stdout' | 'stderr';
  /** Enable/disable colors */
  colors?: boolean;
  /** Custom color scheme */
  colorScheme?: Record<string, string>;
}
```

### File Transport Options

```typescript
interface IFileTransportOptions {
  /** Output filename */
  filename: string;
  /** File mode */
  mode?: 'append' | 'overwrite';
  /** Buffer size in bytes */
  bufferSize?: number;
  /** Enable file rotation */
  rotate?: boolean;
  /** Maximum file size before rotation */
  maxSize?: number;
}
```

### InfluxDB Transport Options

```typescript
interface IInfluxTransportOptions {
  /** InfluxDB host URL */
  host: string;
  /** Authentication token */
  token: string;
  /** Organization name */
  org: string;
  /** Bucket name */
  bucket: string;
  /** Service/application name (optional) */
  service?: string;
  /** Environment (dev/staging/prod) (optional) */
  environment?: string;
  /** Override hostname (optional) */
  hostname?: string;
}
```

### Buffer Transport Options

```typescript
interface IBufferTransportOptions {
  /** Maximum number of entries to store */
  maxEntries?: number;
  /** Delay in milliseconds before transport becomes ready (useful for testing) */
  delayReady?: number;
}
```

## Creating Custom Transports

You can create custom transports by extending the `BaseTransport` class:

```typescript
import { BaseTransport } from '@epdoc/logger';

class CustomTransport extends BaseTransport {
  protected async _write(message: string, data?: unknown): Promise<void> {
    // Your custom output logic here
    console.log(`[CUSTOM] ${message}`);
  }

  protected async _flush(): Promise<void> {
    // Flush any buffered data
  }

  protected async _close(): Promise<void> {
    // Cleanup resources
  }
}
```

## Best Practices

### For Development
- Use `Console.Transport` for immediate feedback
- Add `Buffer.Transport` for testing scenarios
- Set appropriate log levels to avoid noise

### For Production
- Use `File.Transport` for persistent logging
- Use `Influx.Transport` for time-series analysis and monitoring dashboards
- Configure file rotation to manage disk space
- Consider multiple transports for different log levels
- Set appropriate service/environment tags for InfluxDB organization

### For Testing
- Use `Buffer.Transport` exclusively in tests
- Clear buffer between test cases
- Use assertion methods for reliable test verification

```typescript
// Example test setup
const logMgr = new Log.Mgr<Console.Builder>();
const bufferTransport = new Log.Transport.Buffer.BufferTransport(logMgr);
logMgr.addTransport(bufferTransport);
logMgr.threshold = 'debug';

// In test
beforeEach(() => {
  bufferTransport.clear();
});

// Test assertions
bufferTransport.assertContains('Expected message');
bufferTransport.assertCount(2);
```
